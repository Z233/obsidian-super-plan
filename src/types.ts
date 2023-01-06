export type ActivityData = {
	activity: string;
	length: number;
	start: string;
	f: boolean;
	r: boolean;
	actLen: number;
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
