import {
	FormatType,
	optionsWithDefaults,
} from "@tgrosinger/md-advanced-tables";
import type { Options } from "@tgrosinger/md-advanced-tables";

interface PlanEditorSettings {
	formatType: FormatType;
}

interface PlanTrackerSettings {
	planFolder: string;
	noteTemplate: string;
	fileNamePrefix: string;
	fileNameDateFormat: string;
}

type ISettings = PlanEditorSettings & PlanTrackerSettings;

export const defaultSettings: Partial<ISettings> = {
	formatType: FormatType.NORMAL,
	noteTemplate: "",
	fileNamePrefix: "",
	fileNameDateFormat: "DD-MM-YYYY",
};

export class SuperPlanSettings implements ISettings {
	public formatType: FormatType;
	public planFolder: string;
	public noteTemplate: string;
	public fileNamePrefix: string;
	public fileNameDateFormat: string;

	constructor(loadedData: Partial<ISettings>) {
		const allFields = { ...defaultSettings, ...loadedData };
		this.formatType = allFields.formatType!;
		this.planFolder = allFields.planFolder!;
		this.noteTemplate = allFields.noteTemplate!;
		this.fileNamePrefix = allFields.fileNamePrefix!;
		this.fileNameDateFormat = allFields.fileNameDateFormat!;
	}

	public asOptions(): Options {
		return optionsWithDefaults({ formatType: this.formatType });
	}
}
