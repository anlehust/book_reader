import {CloseOutlined,DownOutlined,PlusOutlined,RightOutlined} from '@ant-design/icons';
import {Button,Empty,Popconfirm,Spin,Switch,Tooltip} from 'antd';
import {useEffect,useRef,useState} from 'react';
import type {SavedOnPage,SuggestedWord} from '../../services/suggestionEngine';

type Props={
 enabled:boolean;collapsed:boolean;loading:boolean;error:string;newWords:SuggestedWord[];savedOnPage:SavedOnPage[];
 onEnabledChange:(enabled:boolean)=>void;onCollapsedChange:()=>void;onAdd:(word:SuggestedWord)=>void;onKnown:(word:SuggestedWord)=>void;
};

function SuggestionRow({word,onAdd,onKnown}:{word:SuggestedWord;onAdd:(word:SuggestedWord)=>void;onKnown:(word:SuggestedWord)=>void}){
 const [confirmOpen,setConfirmOpen]=useState(false),timer=useRef<number>(0),clickCount=useRef(0);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const click=(detail:number)=>{clickCount.current=detail;if(detail>1){clearTimeout(timer.current);clickCount.current=0;setConfirmOpen(false);onKnown(word);return}clearTimeout(timer.current);timer.current=window.setTimeout(()=>{if(clickCount.current===1)setConfirmOpen(true);clickCount.current=0},300)};
 return <div className="suggestion-row"><b title={word.surface}>{word.surface}</b><span title={word.meaning}>{word.meaning}</span><Tooltip title="Lưu vào Từ đã lưu"><Button type="text" size="small" icon={<PlusOutlined/>} aria-label={`Lưu ${word.surface}`} onClick={()=>onAdd(word)}/></Tooltip><Popconfirm open={confirmOpen} title="Bỏ qua từ này?" description="Từ này sẽ không được gợi ý nữa" okText="Bỏ qua" cancelText="Huỷ" okButtonProps={{danger:true}} onOpenChange={open=>{if(!open)setConfirmOpen(false)}} onConfirm={()=>{setConfirmOpen(false);onKnown(word)}}><Tooltip title="Đã biết (nhấp đúp để bỏ qua ngay)"><Button className="suggestion-known" type="text" size="small" danger icon={<CloseOutlined/>} aria-label={`Đã biết ${word.surface}`} onClick={event=>click(event.detail)}/></Tooltip></Popconfirm></div>
}

export default function AISuggestionPanel({enabled,collapsed,loading,error,newWords,savedOnPage,onEnabledChange,onCollapsedChange,onAdd,onKnown}:Props){
 const count=newWords.length+savedOnPage.length;
 return <section className={`suggestion-section ${collapsed?'collapsed':''}`}><header className="suggestion-header"><div><h3>🤖 Gợi ý</h3>{enabled&&<span>{count}</span>}</div><div><Switch size="small" checked={enabled} onChange={onEnabledChange} aria-label="Bật tắt gợi ý từ"/>{enabled&&<Button type="text" size="small" icon={collapsed?<RightOutlined/>:<DownOutlined/>} aria-label={collapsed?'Mở gợi ý':'Thu gọn gợi ý'} onClick={onCollapsedChange}/>}</div></header>{enabled&&!collapsed&&<div className="suggestion-list reader-scrollbar">{loading?<Spin size="small"/>:error?<p className="suggestion-state error">{error}</p>:count===0?<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Trang này chưa có từ B2/C1 cần gợi ý"/>:<>{newWords.map(word=><SuggestionRow key={word.lemma} word={word} onAdd={onAdd} onKnown={onKnown}/>)}{savedOnPage.map(word=><div className="suggestion-row saved" key={`saved-${word.source.id}`}><i aria-hidden>●</i><b title={word.word}>{word.word}</b><span title={word.meaning}>{word.meaning}</span></div>)}</>}</div>}</section>
}
