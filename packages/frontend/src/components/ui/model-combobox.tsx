import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { AIModel } from "@/types"

interface ModelComboboxProps {
	models: AIModel[]
	value: string
	onValueChange: (value: string) => void
	placeholder?: string
	groupByVendor?: boolean
}

export function ModelCombobox({
	models,
	value,
	onValueChange,
	placeholder = "选择模型",
	groupByVendor = false,
}: ModelComboboxProps) {
	const [open, setOpen] = React.useState(false)

	const selectedModel = models.find((m) => m.id === value)

	// 按厂商分组
	const groupedModels = React.useMemo(() => {
		if (!groupByVendor) return { "": models }
		const groups: Record<string, AIModel[]> = {}
		models.forEach((m) => {
			const vendor = m.id.split("/")[0] || "other"
			if (!groups[vendor]) groups[vendor] = []
			groups[vendor].push(m)
		})
		return groups
	}, [models, groupByVendor])

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full h-10 justify-between font-normal"
				>
					<span className="truncate">
						{selectedModel ? selectedModel.name : placeholder}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
				<Command>
					<CommandInput placeholder="搜索模型..." />
					<CommandList className="max-h-60">
						<CommandEmpty>未找到模型</CommandEmpty>
						{Object.entries(groupedModels).map(([vendor, vendorModels]) => (
							<CommandGroup key={vendor} heading={vendor || undefined}>
								{vendorModels.map((model) => (
									<CommandItem
										key={model.id}
										value={`${model.id} ${model.name}`}
										onSelect={() => {
											onValueChange(model.id)
											setOpen(false)
										}}
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												value === model.id ? "opacity-100" : "opacity-0"
											)}
										/>
										<span className="truncate">{model.name}</span>
									</CommandItem>
								))}
							</CommandGroup>
						))}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
