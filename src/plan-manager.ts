import type { Extension } from "@codemirror/state";
import type { KeyBinding } from "@codemirror/view";
import type { Focus, TableRow } from "@tgrosinger/md-advanced-tables";
import type SuperPlan from "./main";
import type { PlanEditor } from "./plan-editor";
import type { PlanTableState, Maybe, PlanCellType } from "./types";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { isEqual, debounce } from "lodash-es";
import { getActivityDataIndex } from "./utils/helper";

export class PlanManager {
	private readonly plugin: SuperPlan;
	private lastState: Maybe<PlanTableState>;
	private state: Maybe<PlanTableState>;

	constructor(plugin: SuperPlan) {
		this.plugin = plugin;

		this.plugin.registerEditorExtension(
			this.makeEditorRemappingExtension()
		);
		this.plugin.registerEditorExtension(
			this.makeEditorUpdateListenerExtension()
		);
	}

	private readonly makeEditorUpdateListenerExtension = (): Extension => {
		return EditorView.updateListener.of((v) => {
			if ((!v.selectionSet && !v.focusChanged) || v.docChanged) return;
			const fn = debounce(
				this.plugin.newPerformPlanActionCM6((pe) => {
					const now = pe.getState();
					if (!(now && this.state?.focus.posEquals(now.focus))) {
						const getStartCell = (row: TableRow) =>
							row.getCellAt(getActivityDataIndex("start"))!;

						this.lastState = this.state;
						this.state = now;

						const before = now;
						const beforeCell = before && getStartCell(before.row);
						const scheduled = pe.executeSchedule(this.lastState);

						// set isFixed to true when user manually input start time
						if (
							this.lastState?.type === "start" &&
							scheduled &&
							beforeCell &&
							getStartCell(scheduled.row).content !==
								beforeCell.content
						) {
							pe.executeSchedule(
								{
									...before,
									type: "start",
									cell: beforeCell,
								},
								true
							);
						}
					}
				}),
				10
			);
			fn();
		});
	};

	private readonly makeEditorRemappingExtension = (): Extension => {
		const keymaps: KeyBinding[] = [];
		const shouldNextRow = (cellType: PlanCellType) => {
			const arr: PlanCellType[] = ["actLen", "r"];
			return arr.contains(cellType);
		};

		keymaps.push({
			key: "Enter",
			run: (): boolean =>
				this.plugin.newPerformPlanActionCM6((pe) => {
					const focusedCell = pe.getState();
					if (!focusedCell) return;

					if (shouldNextRow(focusedCell.type)) {
						pe.insertActivity();
					} else {
						pe.nextCell();
					}
				})(),
			preventDefault: true,
		});

		keymaps.push({
			key: "Tab",
			run: (): boolean =>
				this.plugin.newPerformPlanActionCM6((pe: PlanEditor) => {
					pe.nextCell();
				})(),
			shift: (): boolean =>
				this.plugin.newPerformPlanActionCM6((pe: PlanEditor) =>
					pe.previousCell()
				)(),
			preventDefault: true,
		});

		keymaps.push({
			key: "Ctrl-Delete",
			run: () =>
				this.plugin.newPerformPlanActionCM6((pe: PlanEditor) =>
					pe.deleteRow()
				)(),
			preventDefault: true,
		});

		return Prec.override(keymap.of(keymaps));
	};
}
