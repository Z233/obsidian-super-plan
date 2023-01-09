import type {
	Focus,
	Table,
	TableCell,
	TableRow,
} from "@tgrosinger/md-advanced-tables";

export type ActivityData = {
	activity: string;
	length: string;
	start: string;
	f: string;
	r: string;
	actLen: string;
};

export type ActivitiesData = ActivityData[];

export type PlanCellType = keyof ActivityData;
export type PlanTableState = {
	type: PlanCellType;
	cell: TableCell;
	row: TableRow;
	table: Table;
	focus: Focus;
};

export type Activity = {
	activity: string;
	length: number;
	start: number;
	stop: number;
	isFixed: boolean;
	isRound: boolean;
	actLen: number;
};

export type Activities = Activity[];

// https://stackoverflow.com/a/52490977
export type Tuple<T, N extends number> = N extends N
	? number extends N
		? T[]
		: _TupleOf<T, N, []>
	: never;
type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N
	? R
	: _TupleOf<T, N, [T, ...R]>;

export type Maybe<T> = T | null | undefined;
