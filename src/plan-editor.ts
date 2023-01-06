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
import { ActivityDataColumnMap, PlanTableLiteral } from "./constants";
import { ObsidianTextEditor } from "./obsidian-text-editor";
import { PlanEditorSettings } from "./settings";
import { ActivityCellType, ActivityData } from "./types";

export class PlanEditor {
	private readonly app: App;
	private readonly settings: PlanEditorSettings;
	private readonly te: TableEditor;
	private readonly ote: ObsidianTextEditor;

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
	}

	private get tableInfo() {
		return this.te._findTable(this.settings.asOptions())!;
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

	private getActivityRow(activityData: Partial<ActivityData>) {
		return Array.from(
			{ length: this.tableInfo.table.getHeaderWidth() },
			(v, i) =>
				new TableCell(activityData[ActivityDataColumnMap[i]] ?? "")
		);
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

	public readonly cursorIsInTable = (): boolean =>
		this.te.cursorIsInTable(this.settings.asOptions());

	public readonly insertActivity = (): void => {
		const table = this.tableInfo.table;
		const range = this.tableInfo.range;
		const lines = this.tableInfo.lines;

		let newFocus = this.focusPosition!;
		const newFocusRow = newFocus.row;
		const isLastRow = newFocusRow === lines.length - 1;
		console.log("isLastRow", isLastRow);

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
		const row = this.getActivityRow({
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
		const columnCount = this.tableInfo.table.getRows()[0].getCells().length;
		const isLastColumn = this.tableInfo.focus.column === columnCount - 1;

		this.te.format(this.settings.asOptions());

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
				PlanTableLiteral.header,
				PlanTableLiteral.divider,
				PlanTableLiteral.newActivityRow,
				PlanTableLiteral.endRow,
			],
			this.settings.asOptions()
		);
		const completedTable = completeTable(table, this.settings.asOptions());
		const row = this.ote.getCursorPosition().row;
		this.ote.replaceLines(row, row + 1, completedTable.table.toLines());
		this.ote.setCursorPosition(new Point(row + 2, 2));
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
