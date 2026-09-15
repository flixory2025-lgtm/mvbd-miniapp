"use client"
import type { FormEvent, KeyboardEvent } from "react"
import { ArrowUp } from "lucide-react"
type Props={value:string;disabled?:boolean;onChange:(value:string)=>void;onSubmit:()=>void}
export function MvbdAiInput({value,disabled,onChange,onSubmit}:Props){const submit=(e:FormEvent)=>{e.preventDefault();onSubmit()};const keyDown=(e:KeyboardEvent<HTMLInputElement>)=>{if(e.key==='Enter'&&!e.nativeEvent.isComposing&&e.keyCode!==229){e.preventDefault();onSubmit()}};return <form className="mvbd-ai-input-wrap" onSubmit={submit}><input aria-label="Message MVBD AI" placeholder="Message MVBD AI..." value={value} onChange={e=>onChange(e.target.value)} onKeyDown={keyDown} disabled={disabled}/><button type="submit" aria-label="Send message" disabled={disabled||!value.trim()}><ArrowUp size={17}/></button></form>}
