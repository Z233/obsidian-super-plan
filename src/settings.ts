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
}

type ISettings = PlanEditorSettings & PlanTrackerSettings;

export const defaultSettings: Partial<ISettings> = {
	formatType: FormatType.NORMAL,
};

export class SuperPlanSettings implements ISettings {
	public formatType: FormatType;
	public planFolder: string;

	constructor(loadedData: Partial<ISettings>) {
		const allFields = { ...defaultSettings, ...loadedData };
		this.formatType = allFields.formatType!;
		this.planFolder = allFields.planFolder!;
	}

	public asOptions(): Options {
		return optionsWithDefaults({ formatType: this.formatType });
	}
}
