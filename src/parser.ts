import type { SuperPlanSettings } from "./settings";
import type { ActivitiesData, ActivityData } from "./types";
import {
	readTable,
	Table,
	TableCell,
	TableRow,
	insertRow,
	formatTable,
} from "@tgrosinger/md-advanced-tables";
import { _createIsTableRowRegex } from "@tgrosinger/md-advanced-tables/lib/table-editor";
import { ActivityDataColumn, PlanLinesLiteral } from "./constants";
import { getActivityDataKey } from "./utils/helper";

export class Parser {
	private readonly settings: SuperPlanSettings;

	constructor(settings: SuperPlanSettings) {
		this.settings = settings;
	}

	findPlanTable(content: string) {
		const re = _createIsTableRowRegex(
			this.settings.asOptions().leftMarginChars
		);
		const rows = content.split("\n");

		const lines: string[] = [];
		rows.forEach((row) => {
			if (re.test(row)) {
				lines.push(row);
			}
		});

		if (!lines.length) return;

		const table = readTable(lines, this.settings.asOptions());
		return table;
	}

	transformTable(table: Table): ActivitiesData {
		const activitiesRows = table
			.getRows()
			.slice(2)
			.map((row) => row.getCells().map((cell) => cell.content));

		const activitiesData: ActivitiesData = activitiesRows.map((row) =>
			row.reduce(
				(data, v, i) => ({
					...data,
					[ActivityDataColumn[i]]: v,
				}),
				{} as ActivityData
			)
		);

		return activitiesData;
	}

	transformActivitiesData(activitiesData: ActivitiesData): Table {
		const emptyTable = readTable(
			[PlanLinesLiteral.header, PlanLinesLiteral.divider],
			this.settings.asOptions()
		);

		const activitiesRows = activitiesData.map(
			(data) =>
				new TableRow(
					Array.from(
						{ length: emptyTable.getHeaderWidth() },
						(_, i) =>
							new TableCell(data[getActivityDataKey(i) ?? ""])
					),
					"",
					""
				)
		);

		const table = activitiesRows.reduce(
			(t, row, i) => insertRow(t, 2 + i, row),
			emptyTable
		);

		const formatted = formatTable(table, this.settings.asOptions());

		return formatted.table;
	}
}
