export const PlanLinesLiteral = {
	header: `| F   | Activity | Length | Start | R   | ActLen |`,
	divider: `| --- | -------- | ------ | ----- | --- | ------ |`,
	newActivityRow: `| x   |          | 0      | 00:00 |     | 0      |`,
	endRow: `| x   | END      | 0      | 00:00 |     | 0      |`,
};

export const DEFAULT_PLAN_NOTE_CONTENT = `## Plan\n${Object.values(
	PlanLinesLiteral
).join("\n")}
`;

export enum ActivityDataColumnMap {
	"f",
	"activity",
	"length",
	"start",
	"r",
	"actLen",
}
