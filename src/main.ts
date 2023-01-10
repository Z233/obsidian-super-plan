import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	Setting,
} from "obsidian";
import { PlanFile } from "./plan-file";
import { Parser } from "./parser";
import { PlanEditor } from "./plan-editor";
import { SuperPlanSettings } from "./settings";
import { PlanManager } from "./plan-manager";
import { SuperPlanSettingsTab } from "./settings-tab";
import { PlanTracker } from "./plan-tracker";
import { timer } from "./timer";

// Remember to rename these classes and interfaces!

export default class SuperPlan extends Plugin {
	settings: SuperPlanSettings;

	private file: PlanFile;
	private parser: Parser;
	private cmEditors: CodeMirror.Editor[];
	private tracker: PlanTracker;

	async onload() {
		await this.loadSettings();

		this.parser = new Parser(this.settings);
		this.file = new PlanFile(this.app.vault, this.parser, this.settings);

		this.tracker = new PlanTracker(
			this.parser,
			this.file,
			this.settings,
			this.addStatusBarItem()
		);
		this.tracker.init();

		new PlanManager(this);

		this.cmEditors = [];
		this.registerCodeMirror((cm) => {
			this.cmEditors.push(cm);
			cm.on("keydown", this.handleKeyDown);
		});

		this.addCommand({
			id: "insert-plan-table",
			name: "Insert plan table",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.newPerformTableAction((pe) => {
					pe.insertPlanTable();
				})(false, editor, view);
			},
		});

		this.addCommand({
			id: "insert-activity",
			name: "Insert activity",
			editorCheckCallback: this.newPerformTableAction((pe) => {
				pe.insertActivity();
			}),
		});

		this.addCommand({
			id: "start-activity",
			name: "Start activity",
			editorCheckCallback: this.newPerformTableAction((pe) => {
				pe.startCursorActivity();
			}),
		});

		this.addSettingTab(new SuperPlanSettingsTab(this.app, this));

		this.registerInterval(timer.intervalId);

		timer.onTick(this.tick.bind(this));
	}

	async tick() {
		const content = await this.file.getTodayPlanFileContent();
		const planTable = this.parser.findPlanTable(content);
		if (planTable) {
			const activitiesData = this.parser.transformTable(planTable);

			this.tracker.setData(activitiesData, planTable);
		}
	}

	onunload() {
		this.cmEditors.forEach((cm) => {
			cm.off("keydown", this.handleKeyDown);
		});
		timer.removeListener();
	}

	// TODO: handle key for CM5
	private readonly handleKeyDown = (
		cm: CodeMirror.Editor,
		event: KeyboardEvent
	): void => {
		if (["Tab", "Enter"].contains(event.key)) {
		}
	};

	readonly newPerformPlanActionCM6 =
		(fn: (pe: PlanEditor) => void): (() => boolean) =>
		(): boolean => {
			const leaf = this.app.workspace.activeLeaf!;
			if (leaf.view instanceof MarkdownView) {
				const pe = new PlanEditor(
					this.app,
					leaf.view.file,
					leaf.view.editor,
					this.parser,
					this.settings
				);

				if (pe.cursorIsInPlan()) {
					fn(pe);
					return true;
				}
			}
			return false;
		};

	private readonly newPerformTableAction =
		(fn: (pe: PlanEditor) => void, alertOnNoTable = true) =>
		(
			checking: boolean,
			editor: Editor,
			view: MarkdownView
		): boolean | void => {
			const pe = new PlanEditor(
				this.app,
				view.file,
				editor,
				this.parser,
				this.settings
			);

			if (checking) {
				return pe.cursorIsInPlan();
			}

			fn(pe);
		};

	async loadSettings() {
		const settingsOptions = Object.assign({}, await this.loadData());
		this.settings = new SuperPlanSettings(this, settingsOptions);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
