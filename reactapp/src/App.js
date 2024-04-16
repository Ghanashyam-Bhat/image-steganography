import EncodeHeader from './components/title/encode';
import EncodeForm from './components/form/encode';
import DecodeForm from './components/form/decode';

function App() {
  
  return (
    <div className="App">
      <EncodeHeader />
      <div className="encode">
        <EncodeForm />
        <DecodeForm />
      </div>
    </div>
  );
}

export default App;
