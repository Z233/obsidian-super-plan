import {
	FormatType,
	optionsWithDefaults,
} from "@tgrosinger/md-advanced-tables";
import type { Options } from "@tgrosinger/md-advanced-tables";
import { ProgressType } from "./constants";
import type SuperPlan from "./main";

interface PlanEditorSettings {
	formatType: FormatType;
}

interface PlanTrackerSettings {
	planFolder: string;
	noteTemplate: string;
	fileNamePrefix: string;
	fileNameDateFormat: string;
	progressType: ProgressType;
}

type ISettings = PlanEditorSettings & PlanTrackerSettings;

export const defaultSettings: Partial<ISettings> = {
	formatType: FormatType.NORMAL,
	noteTemplate: "",
	fileNamePrefix: "",
	fileNameDateFormat: "DD-MM-YYYY",
	progressType: ProgressType.BAR,
};

type SettingsUpdateCallback = (options: Partial<ISettings>) => void;

export class SuperPlanSettings implements ISettings {
	private readonly plugin: SuperPlan;
	private updateCbs: SettingsUpdateCallback[] = [];

	formatType: FormatType;
	planFolder: string;
	noteTemplate: string;
	fileNamePrefix: string;
	fileNameDateFormat: string;
	progressType: ProgressType;

	constructor(plugin: SuperPlan, loadedData: ISettings) {
		this.plugin = plugin;

		const allFields = { ...defaultSettings, ...loadedData };
		this.formatType = allFields.formatType;
		this.planFolder = allFields.planFolder;
		this.noteTemplate = allFields.noteTemplate;
		this.fileNamePrefix = allFields.fileNamePrefix;
		this.fileNameDateFormat = allFields.fileNameDateFormat;
		this.progressType = allFields.progressType;
	}

	asOptions(): Options {
		return optionsWithDefaults({ formatType: this.formatType });
	}

	update(options: Partial<ISettings>) {
		Object.assign(this, options);
		this.plugin.saveData(this);
		this.updateCbs.forEach((fn) => fn(options));
	}

	onUpdate(cb: SettingsUpdateCallback) {
		this.updateCbs.push(cb);
	}
}
