import { useEffect, useState } from 'react';
import RouteList from './routes';
import store from './store';
import ActionType from './store/action';
import Loading from './view/components/loading';
function App() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    store.subscribe(() => {
      const page = store.getState().page;
      if (page.refresh) {
        setShow(false);
        setTimeout(() => {
          setShow(true);
          store.dispatch({ type: ActionType.REFRESH_PAGE, page: { refresh: false } })
        }, 500);
      }
    });
  });
  return (
    <>
      {
        show ? <RouteList /> : <Loading />
      }
    </>
  );
}

export default App;
