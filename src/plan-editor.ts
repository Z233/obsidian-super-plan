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
import { FormattedTable } from "@tgrosinger/md-advanced-tables/lib/formatter";
import { App, Editor, TFile } from "obsidian";
import { ActivityDataColumnMap, PlanLinesLiteral } from "./constants";
import { ObsidianTextEditor } from "./obsidian-text-editor";
import { Plan } from "./plan";
import { PlanEditorSettings } from "./settings";
import { ActivitiesData, ActivityCellType, ActivityData } from "./types";
import { removeSpacing } from "./utils/helper";

export class PlanEditor {
	private readonly app: App;
	private readonly settings: PlanEditorSettings;
	private readonly te: TableEditor;
	private readonly ote: ObsidianTextEditor;

	private plan: Plan | null = null;

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

		this.initPlan();
	}

	private initPlan() {
		if (!this.tableInfo) return;
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

		this.plan = new Plan(activitiesData);
	}

	private get tableInfo() {
		return this.te._findTable(this.settings.asOptions());
	}

	private get focusPosition() {
		const rowOffset = this.tableInfo?.range.start.row;
		if (rowOffset !== undefined) {
			const cursor = this.ote.getCursorPosition();
			const focus = this.tableInfo?.table.focusOfPosition(
				cursor,
				rowOffset
			);
			return focus;
		}
		return null;
	}

	private createActivityRow(activityData: Partial<ActivityData>) {
		return Array.from(
			{ length: this.tableInfo?.table.getHeaderWidth() ?? 0 },
			(v, i) =>
				new TableCell(activityData[ActivityDataColumnMap[i]] ?? "")
		);
	}

	private get shouldSchedule() {
		if (!this.plan) return false;
		const cellsTriggerSchedule: ActivityCellType[] = [
			"length",
			"start",
			"f",
			"r",
		];
		const cursorCellType = this.getCursorCellType();
		return (
			!!cursorCellType && cellsTriggerSchedule.contains(cursorCellType)
		);
	}

	private schedule() {
		if (!this.shouldSchedule || !this.tableInfo) return;

		this.plan!.schedule();
		const activitiesData = this.plan!.getData();

		const focus = this.tableInfo.focus;
		const range = this.tableInfo.range;
		const table = this.tableInfo.table;
		const lines = this.tableInfo.lines;

		const rows = activitiesData.map(
			(data) => new TableRow(this.createActivityRow(data), "", "")
		);

		const [header, delimiter] = table.getRows();

		const newTable = new Table([header, delimiter, ...rows]);

		// format
		const formatted = formatTable(newTable, this.settings.asOptions());

		this.ote.transact(() => {
			this.te._updateLines(
				range.start.row,
				range.end.row + 1,
				formatted.table.toLines(),
				lines
			);
			this.te._moveToFocus(range.start.row, formatted.table, focus);
		});
	}

	public readonly getCursorCellType = (): ActivityCellType | null => {
		const tableInfo = this.tableInfo;
		const table = tableInfo?.table;
		if (table) {
			const cursor = this.ote.getCursorPosition();
			const rowOffset = tableInfo.range.start.row;

			const focus = table.focusOfPosition(cursor, rowOffset);

			if (focus) {
				const focusedRow = table.getRows()[focus.row];
				const focusedCell = table.getFocusedCell(focus);
				const focusedCellIndex = focusedRow
					.getCells()
					.findIndex((c) => c === focusedCell);
				return ActivityDataColumnMap[focusedCellIndex];
			}
		}

		return null;
	};

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

		const table = this.tableInfo.table;
		const range = this.tableInfo.range;
		const lines = this.tableInfo.lines;

		let newFocus = this.focusPosition!;
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
		newFocus = newFocus.setColumn(0);
		// insert an empty row
		const row = this.createActivityRow({
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

		this.schedule();

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
