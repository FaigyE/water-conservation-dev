"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Check, X } from 'lucide-react'
import { cn } from "@/lib/utils"

interface EditableTextProps {
  value: string
  onChange: (newValue: string) => void
  placeholder?: string
  multiline?: boolean
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div"
  className?: string
  displayValue?: string // Optional: value to display when not editing
}

export function EditableText({
  value,
  onChange,
  placeholder = "Click to edit",
  multiline = false,
  as: Component = "span",
  className,
  displayValue,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentValue, setCurrentValue] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setCurrentValue(value)
  }, [value])

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    // This will be handled by save/cancel buttons
    // setIsEditing(false);
    // setCurrentValue(value); // Revert on blur if not explicitly saved
  }

  const handleSave = () => {
    onChange(currentValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setCurrentValue(value) // Revert to original value
    setIsEditing(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !multiline) {
      event.preventDefault()
      handleSave()
    }
    if (event.key === "Escape") {
      handleCancel()
    }
  }

  const displayedText = displayValue !== undefined ? displayValue : value

  return (
    <Component
      className={cn("group relative inline-block", className)}
      onDoubleClick={handleDoubleClick}
      tabIndex={isEditing ? -1 : 0} // Make non-editable span focusable
      aria-label={placeholder}
    >
      {isEditing ? (
        <div className="flex items-center gap-2">
          {multiline ? (
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="editable-text-textarea min-h-[60px] flex-grow"
              autoFocus
            />
          ) : (
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="editable-text-input flex-grow"
              autoFocus
            />
          )}
          <Button
            onClick={handleSave}
            size="icon"
            variant="ghost"
            className="editable-text-button h-8 w-8 shrink-0"
            aria-label="Save"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleCancel}
            size="icon"
            variant="ghost"
            className="editable-text-button h-8 w-8 shrink-0"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <span className="editable-text-display cursor-pointer rounded-md p-1 hover:bg-gray-100 group-focus-within:ring-2 group-focus-within:ring-ring group-focus-within:ring-offset-2">
          {displayedText || placeholder}
        </span>
      )}
    </Component>
  )
}

// Add default export
export default EditableText
