import { ButtonComponent, type TooltipOptions } from "obsidian";

export function tooltipAction(el: HTMLElement, leftMins: number) {
	const tooltipOptions: TooltipOptions = {
		placement: "top",
	};

	const tooltipButtonComp = new ButtonComponent(el);
	const setTooltipText = (leftMins: number) =>
		tooltipButtonComp.setTooltip(`Left: ${leftMins} mins`, tooltipOptions);
	setTooltipText(leftMins);

	return {
		update(leftMins: number) {
			setTooltipText(leftMins);
		},
	};
}
