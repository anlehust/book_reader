import {UndoOutlined} from '@ant-design/icons';
import {Button,Empty,Input,Spin,Tooltip} from 'antd';
import {useMemo,useState} from 'react';
import type {KnownWord} from '../../db/types';

type Props={words:KnownWord[];loading:boolean;onUndo:(lemma:string)=>void};
export default function KnownWordsPanel({words,loading,onUndo}:Props){
 const [search,setSearch]=useState('');const visible=useMemo(()=>{const query=search.trim().toLowerCase();return words.filter(word=>!query||word.lemma.includes(query))},[search,words]);
 return <div className="known-words-panel"><header><b>🧠 Từ đã biết</b><span>{words.length}</span></header><Input allowClear size="small" placeholder="Tìm từ..." value={search} onChange={event=>setSearch(event.target.value)}/>{loading?<Spin size="small"/>:visible.length?<div className="known-words-list reader-scrollbar">{visible.map(word=><div key={word.lemma}><span>{word.lemma}</span><Tooltip title="Đưa lại vào gợi ý"><Button type="text" size="small" icon={<UndoOutlined/>} aria-label={`Gợi ý lại ${word.lemma}`} onClick={()=>onUndo(word.lemma)}/></Tooltip></div>)}</div>:<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có từ đã biết"/>}</div>
}
