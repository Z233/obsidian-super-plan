import { ActivityDataColumnMap } from "src/constants";
import { ActivitiesData, ActivityData, PlanCellType } from "src/types";

export const getMarkdownTableHeader =
	() => `| **Activity** | **Length** | **Start** | **F** | **R** | **ActLen** |
| ------------ | ---------- | --------- | ----- | ----- | ---------- |`;

export const getMarkdownEndRow = () =>
	`| END          | 0          | 00:00     | x     |       | 0          |`;

export const getMarkdownRow = () =>
	`| END          | 0          | 00:00     | x     |       | 0          |`;

export const removeSpacing = (value: string) => value.replace(/\s+/gm, "");

export const getActivityDataKey = (index: number) =>
	ActivityDataColumnMap[index] as PlanCellType;

export const getActivityDataIndex = (key: PlanCellType) =>
	ActivityDataColumnMap[key] as number;

function tryParse2Int(value?: string) {
	const ret = parseInt(value!);
	return isNaN(ret) ? 0 : ret;
}

function paddingZero(value: number) {
	return String(value).padStart(2, "0");
}

export function parseTime2Mins(value: string) {
	const [hoursString, minsString] = value.split(":");

	const hours = tryParse2Int(hoursString) % 24;
	const mins = tryParse2Int(minsString) % 60;

	return hours * 60 + mins;
}

export function parseMins2Time(value: number) {
	const hours = Math.floor(value / 60);
	const mins = value - hours * 60;
	return `${paddingZero(hours % 24)}:${paddingZero(mins)}` as const;
}
