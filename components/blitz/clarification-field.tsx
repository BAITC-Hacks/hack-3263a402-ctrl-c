"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { ClarifyingQuestion } from "@/lib/teaching";
import { useState } from "react";

export function ClarificationField({ question, index, value, onChange }: { question: ClarifyingQuestion; index: number; value: string; onChange: (value: string) => void }) {
  const [custom, setCustom] = useState(false);
  const match = question.options.indexOf(value);
  const selection = custom || (value !== "" && match < 0) ? "custom" : match >= 0 ? String(match) : "";
  return <fieldset className="clarification-field"><legend><span>{String(index + 1).padStart(2, "0")}</span>{question.prompt}</legend>
    <RadioGroup className="quick-answers" aria-label={question.prompt} value={selection} onValueChange={selected => {
      setCustom(selected === "custom");
      if (selected !== "custom") onChange(question.options[Number(selected)]);
      else if (match >= 0) onChange("");
    }}>
      {question.options.map((option, i) => <label className={selection === String(i) ? "selected" : ""} key={i} htmlFor={`clarify-${index}-option-${i}`}><RadioGroupItem id={`clarify-${index}-option-${i}`} value={String(i)} /><span>{option}</span></label>)}
      <label className={selection === "custom" ? "selected" : ""} htmlFor={`clarify-${index}-custom`}><RadioGroupItem id={`clarify-${index}-custom`} value="custom" /><span>Свой ответ</span></label>
    </RadioGroup>
    {selection === "custom" && <><label className="custom-answer-label" htmlFor={`clarify-${index}`}>Расскажи своими словами</label><Textarea id={`clarify-${index}`} value={value} onChange={e => onChange(e.target.value)} placeholder={question.placeholder} required maxLength={600} autoFocus /></>}
    {selection !== "custom" && selection !== "" && <button className="refine-answer" type="button" onClick={() => setCustom(true)}>Дополнить этот ответ</button>}
  </fieldset>;
}
