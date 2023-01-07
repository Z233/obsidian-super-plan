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
import {
	deleteRow,
	FormattedTable,
} from "@tgrosinger/md-advanced-tables/lib/formatter";
import { isEqual } from "lodash-es";
import { App, Editor, TFile } from "obsidian";
import { ActivityDataColumnMap, PlanLinesLiteral } from "./constants";
import { ObsidianTextEditor } from "./obsidian-text-editor";
import { Plan } from "./plan";
import { PlanEditorSettings } from "./settings";
import {
	ActivitiesData,
	PlanCell,
	ActivityData,
	Maybe,
	PlanCellType,
} from "./types";
import { removeSpacing } from "./utils/helper";

export class PlanEditor {
	private readonly app: App;
	private readonly settings: PlanEditorSettings;
	private readonly te: TableEditor;
	private readonly ote: ObsidianTextEditor;

	// private readonly plan: Plan | null = null;

	constructor(
		app: App,
		file: TFile,
		editor: Editor,
		settings: PlanEditorSettings
	) {
		this.app = app;
		this.settings = settings;

		this.ote = new ObsidianTextEditor(app, file, editor, settings);
		this.te = new TableEditor(this.ote);

		// const activitiesData = this.getActivitiesData();
		// if (activitiesData.length > 0) {
		// 	this.plan = new Plan(activitiesData);
		// }
	}

	private getActivitiesData(): ActivitiesData {
		if (!this.tableInfo) return [];
		const table = this.tableInfo.table;
		const activitiesRows = table
			.getRows()
			.slice(2)
			.map((row) => row.getCells().map((cell) => cell.content));

		const activitiesData: ActivitiesData = activitiesRows.map((row) =>
			row.reduce(
				(data, v, i) => ({
					...data,
					[ActivityDataColumnMap[i]]: v,
				}),
				{} as ActivityData
			)
		);

		return activitiesData;
	}

	private get tableInfo() {
		return this.te._findTable(this.settings.asOptions());
	}

	private createActivityCells(activityData: Partial<ActivityData>) {
		return Array.from(
			{ length: this.tableInfo?.table.getHeaderWidth() ?? 0 },
			(v, i) =>
				new TableCell(activityData[ActivityDataColumnMap[i]] ?? "")
		);
	}

	private get shouldSchedule() {
		// if (!this.plan) return false;
		const cellsTriggerSchedule: PlanCellType[] = [
			"length",
			"start",
			"f",
			"r",
		];
		const cursorCell = this.getCursorCell();
		return !!cursorCell && cellsTriggerSchedule.contains(cursorCell.type);
	}

	private schedule(activitiesData: ActivitiesData) {
		if (!this.shouldSchedule || !this.tableInfo) return;

		const plan = new Plan(activitiesData);
		plan.schedule();
		const scheduledActivitiesData = plan.getData();

		// if (isEqual(activitiesData, scheduledActivitiesData)) return;

		const { table, range, lines, focus } = this.tableInfo;

		const selectionRange = window.getSelection()?.getRangeAt(0);
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
	}

	public readonly getCursorCell = (): PlanCell | null => {
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
				type: ActivityDataColumnMap[focusedCellIndex],
				cell: focusedCell!,
				row: focusedRow,
				table,
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

	public readonly insertActivityAbove = (): void => {
		this.te.insertRow(this.settings.asOptions());
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

	readonly onFocusCellChanged = (lastActiveCell: Maybe<PlanCell>) => {
		if (!this.tableInfo) return;

		const activitiesData = this.getActivitiesData();
		if (lastActiveCell?.type === "start") {
			const { cell: lastCell, row, table: lastTable } = lastActiveCell;
			const rows = lastTable.getRows();
			const rowIndex = rows.findIndex((r) => r === row);
			const columnIndex = rows[rowIndex]
				.getCells()
				.findIndex((c) => c === lastCell);

			const { table, range, lines, focus } = this.tableInfo;
			const cell = table.getCellAt(rowIndex, columnIndex);

			if (cell?.content !== lastCell.content) {
				const updatedActivityData = {
					...activitiesData[rowIndex - 2],
					f: "x",
				};
				activitiesData[rowIndex - 2] = updatedActivityData;
				const cells = this.createActivityCells(updatedActivityData);
				const newRow = new TableRow(cells, "", "");

				let altered = table;
				altered = deleteRow(altered, rowIndex);
				altered = insertRow(altered, rowIndex, newRow);

				// format
				const formatted = formatTable(
					altered,
					this.settings.asOptions()
				);

				this.te._updateLines(
					range.start.row,
					range.end.row + 1,
					formatted.table.toLines(),
					lines
				);
				this.te._moveToFocus(range.start.row, formatted.table, focus);
			}
		}

		this.schedule(activitiesData);
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
