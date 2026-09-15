import { Bot, User } from "lucide-react"

const AI_AVATAR = "https://i.postimg.cc/Wz5YXJgC/c6d87db279f921d6f9c5b1be88b84014.jpg"

export type MvbdAiChatMessage={role:"user"|"assistant";content:string;error?:boolean}

export function MvbdAiMessage({role,content,error}:MvbdAiChatMessage){const user=role==='user';return <div className={`mvbd-ai-message ${user?'is-user':'is-assistant'}`}><span className="mvbd-ai-avatar" aria-hidden="true">{user?<User size={14}/>:<img src={AI_AVATAR} alt="MVBD AI"/>}</span><p className={error?'is-error':undefined}>{content}</p></div>}

export function MvbdAiTyping(){return <div className="mvbd-ai-message is-assistant" aria-label="Assistant is typing"><span className="mvbd-ai-avatar"><img src={AI_AVATAR} alt="MVBD AI"/></span><p className="mvbd-ai-typing"><i/><i/><i/></p></div>}
