import { ActivityData, Tuple } from "./types";

export const PlanLinesLiteral = {
	header:         `| **Activity** | **Length** | **Start** | **F** | **R** | **ActLen** |`,
  divider:        `| ------------ | ---------- | --------- | ----- | ----- | ---------- |`,
	newActivityRow: `|              | 0          | 00:00     | x     |       | 0          |`,
	endRow:         `| END          | 0          | 00:00     | x     |       | 0          |`,
};

export const ActivityDataColumnMap: Readonly<Tuple<keyof ActivityData, 6>> = [
	"activity",
	"length",
	"start",
	"f",
	"r",
	"actLen",
] as const;
