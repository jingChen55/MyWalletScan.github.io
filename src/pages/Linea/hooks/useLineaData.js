import { useEffect, useState } from 'react';

export const useLineaData = () => {
  const [ data, setData ] = useState( [] );
  const [ initialized, setInitialized ] = useState( false );

  useEffect( () => {
    const storedAddresses = localStorage.getItem( "linea_addresses" );
    if ( storedAddresses ) {
      setData( JSON.parse( storedAddresses ) );
    }
    setInitialized( true );
  }, [] );

  useEffect( () => {
    if ( !initialized ) return;
    localStorage.setItem( "linea_addresses", JSON.stringify( data ) );
  }, [ data, initialized ] );

  return [ data, setData ];
};
