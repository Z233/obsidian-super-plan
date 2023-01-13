import {
	TableEditor,
	Point,
	Table,
	TableCell,
	TableRow,
	formatTable,
	readTable,
	completeTable,
	insertRow,
	Focus,
} from "@tgrosinger/md-advanced-tables";
import { deleteRow } from "@tgrosinger/md-advanced-tables/lib/formatter";
import type { FormattedTable } from "@tgrosinger/md-advanced-tables/lib/formatter";
import { isEqual } from "lodash-es";
import type { App, Editor, TFile } from "obsidian";
import { PlanLinesLiteral } from "./constants";
import { ObsidianTextEditor } from "./obsidian-text-editor";
import type { Parser } from "./parser";
import { Plan } from "./plan";
import type { SuperPlanSettings } from "./settings";
import type {
	ActivitiesData,
	PlanTableState,
	ActivityData,
	Maybe,
	PlanCellType,
} from "./types";
import {
	getActivityDataIndex,
	getActivityDataKey,
	getNowMins,
	parseMins2Time,
	removeSpacing,
} from "./utils/helper";

export class PlanEditor {
	private readonly app: App;
	private readonly settings: SuperPlanSettings;
	private readonly te: TableEditor;
	private readonly ote: ObsidianTextEditor;
	private readonly parser: Parser;

	// private readonly plan: Plan | null = null;

	constructor(
		app: App,
		file: TFile,
		editor: Editor,
		parser: Parser,
		settings: SuperPlanSettings
	) {
		this.app = app;
		this.settings = settings;
		this.parser = parser;

		this.ote = new ObsidianTextEditor(app, file, editor, settings);
		this.te = new TableEditor(this.ote);

		// const activitiesData = this.getActivitiesData();
		// if (activitiesData.length > 0) {
		// 	this.plan = new Plan(activitiesData);
		// }
	}

	private getActivitiesData(): ActivitiesData {
		if (!this.tableInfo) return [];
		return this.parser.transformTable(this.tableInfo.table);
	}

	private get tableInfo() {
		return this.te._findTable(this.settings.asOptions());
	}

	private createActivityCells(activityData: Partial<ActivityData>) {
		return Array.from(
			{ length: this.tableInfo?.table.getHeaderWidth() ?? 0 },
			(v, i) => new TableCell(activityData[getActivityDataKey(i)] ?? "")
		);
	}

	private createActivityRow(activityData: Partial<ActivityData>) {
		return new TableRow(this.createActivityCells(activityData), "", "");
	}

	private shouldSchedule(type: PlanCellType) {
		const cellsTriggerSchedule: PlanCellType[] = [
			"length",
			"start",
			"f",
			"r",
		];
		return cellsTriggerSchedule.contains(type);
	}

	private schedule(activitiesData: ActivitiesData) {
		if (!this.tableInfo) return;

		const plan = new Plan(activitiesData);
		plan.schedule();
		const scheduledActivitiesData = plan.getData();

		if (isEqual(activitiesData, scheduledActivitiesData)) return;

		const { table, range, lines, focus } = this.tableInfo;

		const selection = window.getSelection();
		const selectionRange =
			selection && selection.rangeCount > 0 && selection.getRangeAt(0);
		const shouldSelectCell =
			!!selectionRange &&
			selectionRange.endOffset > selectionRange.startOffset;

		const rows = scheduledActivitiesData.map(
			(data) => new TableRow(this.createActivityCells(data), "", "")
		);

		const [header, delimiter] = table.getRows();

		const newTable = new Table([header, delimiter, ...rows]);

		// format
		const formatted = formatTable(newTable, this.settings.asOptions());

		this.te._updateLines(
			range.start.row,
			range.end.row + 1,
			formatted.table.toLines(),
			lines
		);
		this.te._moveToFocus(range.start.row, formatted.table, focus);
		if (shouldSelectCell) {
			this.te.selectCell(this.settings.asOptions());
		}

		return formatted.table;
	}

	public readonly getState = (): PlanTableState | null => {
		if (!this.tableInfo) return null;
		const table = this.tableInfo.table;
		const cursor = this.ote.getCursorPosition();
		const rowOffset = this.tableInfo!.range.start.row;

		const focus = table.focusOfPosition(cursor, rowOffset);

		if (focus) {
			const focusedRow = table.getRows()[focus.row];
			const focusedCell = table.getFocusedCell(focus);
			const focusedCellIndex = focusedRow
				.getCells()
				.findIndex((c) => c === focusedCell);
			return {
				type: getActivityDataKey(focusedCellIndex),
				cell: focusedCell!,
				row: focusedRow,
				table,
				focus,
			};
		}

		return null;
	};

	getFocusInTable() {
		return this.tableInfo?.focus;
	}

	public readonly cursorIsInPlan = (): boolean => {
		if (!this.tableInfo) return false;
		const headerLine = this.tableInfo.lines[0];
		return (
			removeSpacing(headerLine) === removeSpacing(PlanLinesLiteral.header)
		);
	};

	public readonly cursorIsInTable = (): boolean =>
		this.te.cursorIsInTable(this.settings.asOptions());

	public readonly insertActivity = (): void => {
		if (!this.tableInfo) return;

		const { table, range, lines, focus } = this.tableInfo;

		let newFocus = focus;
		const newFocusRow = newFocus.row;
		const isLastRow = newFocusRow === lines.length - 1;

		// move focus
		if (newFocus.row <= 1) {
			newFocus = newFocus.setRow(2);
		} else {
			newFocus = newFocus.setRow(
				isLastRow ? newFocusRow : newFocusRow + 1
			);
		}
		newFocus = newFocus.setColumn(1);
		// insert an empty row
		const row = this.createActivityCells({
			length: "0",
		});
		const altered = insertRow(
			table,
			newFocusRow,
			new TableRow(row, "", "")
		);

		// format
		const formatted = formatTable(altered, this.settings.asOptions());
		newFocus = newFocus.setOffset(
			_computeNewOffset(newFocus, altered, formatted, false)
		);
		// apply
		this.ote.transact(() => {
			this.te._updateLines(
				isLastRow ? range.start.row : range.start.row + 1,
				range.end.row + 1,
				formatted.table.toLines(),
				lines
			);
			this.te._moveToFocus(range.start.row, formatted.table, newFocus);
		});
		this.te.resetSmartCursor();
	};

	getCursorActivityData(): Maybe<{
		index: number;
		data: ActivityData;
	}> {
		const focus = this.tableInfo?.focus;
		if (!focus) return null;
		const index = focus.row - 2;
		const activitiesData = this.getActivitiesData();
		const cursorActivityData = activitiesData[index];

		return {
			index,
			data: cursorActivityData,
		};
	}

	public readonly startActivity = (): void => {
		const cursor = this.getCursorActivityData();
		if (!cursor) return;
		const { data: cursorActivityData, index } = cursor;
		const activitiesData = this.getActivitiesData();

		const updatedActivityData: ActivityData = {
			...cursorActivityData,
			start: parseMins2Time(getNowMins()),
			f: "x",
		};
		activitiesData[index] = updatedActivityData;

		this.schedule(activitiesData);
	};

	readonly ignoreActivity = () => {
		const cursor = this.getCursorActivityData();
		if (!cursor) return;

		const { data: cursorActivityData, index } = cursor;
		const activitiesData = this.getActivitiesData();

		const updatedActivityData: ActivityData = {
			...cursorActivityData,
			length: "0",
			f: "",
		};
		activitiesData[index] = updatedActivityData;

		this.schedule(activitiesData);
	};

	public readonly insertActivityAbove = (): void => {
		this.te.insertRow(this.settings.asOptions());
	};

	public readonly splitActivity = (
		firstLength: number,
		secondLength: number
	) => {
		const cursor = this.getCursorActivityData();
		if (!cursor) return;
		const { data, index: rowIndex } = cursor;

		const firstActivityData: ActivityData = {
			...data,
			activity: `${data.activity} (#1)`,
			length: firstLength.toString(),
		};

		const secondActivityData: ActivityData = {
			...data,
			activity: `${data.activity} (#2)`,
			length: secondLength.toString(),
			f: "",
		};

		const { table, range, lines, focus } = this.tableInfo!;
		const firstIndex = rowIndex + 2;
		let altered = table;
		altered = deleteRow(altered, firstIndex);
		altered = insertRow(
			altered,
			firstIndex,
			this.createActivityRow(firstActivityData)
		);
		altered = insertRow(
			altered,
			firstIndex + 1,
			this.createActivityRow(secondActivityData)
		);

		const formatted = formatTable(altered, this.settings.asOptions());

		this.te._updateLines(
			range.start.row,
			range.end.row + 1,
			formatted.table.toLines(),
			lines
		);
		this.te._moveToFocus(
			range.start.row,
			formatted.table,
			focus
				.setRow(firstIndex + 1)
				.setColumn(getActivityDataIndex("activity"))
		);
	};

	public readonly nextRow = (): void => {
		this.te.nextRow(this.settings.asOptions());
	};

	public readonly nextCell = (): void => {
		if (!this.tableInfo) return;

		const columnCount = this.tableInfo.table.getRows()[0].getCells().length;
		const isLastColumn = this.tableInfo.focus.column === columnCount - 1;

		this.te.moveFocus(
			isLastColumn ? 1 : 0,
			isLastColumn ? -columnCount + 1 : 1,
			this.settings.asOptions()
		);
	};

	public readonly previousCell = (): void => {
		this.te.previousCell(this.settings.asOptions());
	};

	public readonly insertPlanTable = () => {
		const table = readTable(
			[
				PlanLinesLiteral.header,
				PlanLinesLiteral.divider,
				PlanLinesLiteral.newActivityRow,
				PlanLinesLiteral.endRow,
			],
			this.settings.asOptions()
		);
		const completedTable = completeTable(table, this.settings.asOptions());
		const row = this.ote.getCursorPosition().row;
		this.ote.replaceLines(row, row + 1, completedTable.table.toLines());
		this.ote.setCursorPosition(new Point(row + 2, 8));
	};

	public readonly deleteRow = (): void => {
		this.te.deleteRow(this.settings.asOptions());
	};

	readonly executeSchedule = (
		lastState: Maybe<PlanTableState>,
		setFixed = false
	): Maybe<PlanTableState> => {
		if (
			!this.tableInfo ||
			!lastState ||
			!this.shouldSchedule(lastState.type)
		)
			return;

		const activitiesData = this.getActivitiesData();
		const { cell: lastCell, row: lastRow, table: lastTable } = lastState;
		const rows = lastTable.getRows();
		const rowIndex = rows.findIndex((r) => r === lastRow);
		const columnIndex = rows[rowIndex]
			.getCells()
			.findIndex((c) => c === lastCell);

		const { table, range, lines, focus } = this.tableInfo;
		const cell = table.getCellAt(rowIndex, columnIndex);

		if (!cell) return;

		if (lastState.type === "start" && setFixed) {
			const updatedActivityData = {
				...activitiesData[rowIndex - 2],
				f: "x",
				start: lastCell.content,
			};
			activitiesData[rowIndex - 2] = updatedActivityData;
			const cells = this.createActivityCells(updatedActivityData);
			const newRow = new TableRow(cells, "", "");

			let altered = table;
			altered = deleteRow(altered, rowIndex);
			altered = insertRow(altered, rowIndex, newRow);

			// format
			const formatted = formatTable(altered, this.settings.asOptions());

			this.te._updateLines(
				range.start.row,
				range.end.row + 1,
				formatted.table.toLines(),
				lines
			);
			this.te._moveToFocus(range.start.row, formatted.table, focus);
		}

		const scheduledTable = this.schedule(activitiesData);
		if (!scheduledTable) return;

		const scheduledRow = scheduledTable.getRows()[rowIndex];
		const scheduledCell = scheduledTable.getCellAt(rowIndex, columnIndex)!;

		return {
			cell: scheduledCell,
			focus,
			row: scheduledRow,
			table: scheduledTable,
			type: getActivityDataKey(columnIndex),
		};
	};

	readonly moveFocus = (rowOffset: number, columnOffset: number) => {
		this.te.moveFocus(rowOffset, columnOffset, this.settings.asOptions());
	};
}

const _computeNewOffset = (
	focus: Focus,
	table: Table,
	formatted: FormattedTable,
	moved: boolean
): number => {
	if (moved) {
		const formattedFocusedCell = formatted.table.getFocusedCell(focus);
		if (formattedFocusedCell !== undefined) {
			return formattedFocusedCell.computeRawOffset(0);
		}
		return focus.column < 0 ? formatted.marginLeft.length : 0;
	}
	const focusedCell = table.getFocusedCell(focus);
	const formattedFocusedCell = formatted.table.getFocusedCell(focus);
	if (focusedCell !== undefined && formattedFocusedCell !== undefined) {
		const contentOffset = Math.min(
			focusedCell.computeContentOffset(focus.offset),
			formattedFocusedCell.content.length
		);
		return formattedFocusedCell.computeRawOffset(contentOffset);
	}
	return focus.column < 0 ? formatted.marginLeft.length : 0;
};
