import type { ActivityData, Tuple } from "./types";

export const PlanLinesLiteral = {
	header: `| F   | Activity | Length | Start | R   | ActLen |`,
	divider: `| --- | -------- | ------ | ----- | --- | ------ |`,
	newActivityRow: `| x   |          | 0      | 00:00 |     | 0      |`,
	endRow: `| x   | END      | 0      | 00:00 |     | 0      |`,
};

// export const ActivityDataColumnMap: Readonly<Tuple<keyof ActivityData, 6>> = [
// 	"f",
// 	"activity",
// 	"length",
// 	"start",
// 	"r",
// 	"actLen",
// ] as const;

export enum ActivityDataColumnMap {
	"f",
	"activity",
	"length",
	"start",
	"r",
	"actLen",
}
