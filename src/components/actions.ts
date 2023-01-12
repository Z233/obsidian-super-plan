import { ButtonComponent, type TooltipOptions } from "obsidian";

export function tooltipAction(el: HTMLElement, leftMins: number) {
	const tooltipOptions: TooltipOptions = {
		placement: "top",
	};

	const tooltipButtonComp = new ButtonComponent(el);
	const setTooltipText = (leftMins: number) => {
		const content = leftMins > 0 ? `Left: ${leftMins} mins` : "Done";
		tooltipButtonComp.setTooltip(content, tooltipOptions);
	};
	setTooltipText(leftMins);

	return {
		update(leftMins: number) {
			setTooltipText(leftMins);
		},
	};
}
