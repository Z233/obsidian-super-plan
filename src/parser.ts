import { readTable, Table } from "@tgrosinger/md-advanced-tables";
import { _createIsTableRowRegex } from "@tgrosinger/md-advanced-tables/lib/table-editor";
import { ActivityDataColumnMap } from "./constants";
import { SuperPlanSettings } from "./settings";
import { ActivitiesData, ActivityData } from "./types";

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
					[ActivityDataColumnMap[i]]: v,
				}),
				{} as ActivityData
			)
		);

		return activitiesData;
	}
}
