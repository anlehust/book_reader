import {act,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import type {SuggestedWord} from '../../services/suggestionEngine';
import AISuggestionPanel from './AISuggestionPanel';

const word:SuggestedWord={word:'proprietary',surface:'proprietary',lemma:'proprietary',level:'B2',pos:'adj',vi:'',meaning:'Chưa có nghĩa'};
const base={enabled:true,collapsed:false,loading:false,error:'',newWords:[word],savedOnPage:[],onEnabledChange:vi.fn(),onCollapsedChange:vi.fn(),onAdd:vi.fn(),onKnown:vi.fn()};
describe('AISuggestionPanel',()=>{
 afterEach(()=>{vi.useRealTimers();vi.clearAllMocks()});
 it('renders placeholder meaning and saves a suggestion',()=>{render(<AISuggestionPanel {...base}/>);expect(screen.getByText('Chưa có nghĩa')).toBeInTheDocument();fireEvent.click(screen.getByLabelText('Lưu proprietary'));expect(base.onAdd).toHaveBeenCalledWith(word)});
 it('shows only the header while disabled',()=>{render(<AISuggestionPanel {...base} enabled={false}/>);expect(screen.getByText('🤖 Gợi ý')).toBeInTheDocument();expect(screen.queryByText('proprietary')).not.toBeInTheDocument()});
 it('double click marks known without opening confirmation',()=>{vi.useFakeTimers();render(<AISuggestionPanel {...base}/>);const button=screen.getByLabelText('Đã biết proprietary');fireEvent.click(button,{detail:1});fireEvent.click(button,{detail:2});act(()=>vi.advanceTimersByTime(350));expect(base.onKnown).toHaveBeenCalledOnce();expect(screen.queryByText('Bỏ qua từ này?')).not.toBeInTheDocument()});
 it('single click opens confirmation after the double-click window',()=>{vi.useFakeTimers();render(<AISuggestionPanel {...base}/>);fireEvent.click(screen.getByLabelText('Đã biết proprietary'),{detail:1});act(()=>vi.advanceTimersByTime(350));expect(screen.getByText('Bỏ qua từ này?')).toBeInTheDocument()});
});
