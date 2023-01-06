export const getMarkdownTableHeader =
	() => `| **Activity** | **Length** | **Start** | **F** | **R** | **ActLen** |
| ------------ | ---------- | --------- | ----- | ----- | ---------- |`;

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
	return `${paddingZero(hours)}:${paddingZero(mins)}` as const;
}
