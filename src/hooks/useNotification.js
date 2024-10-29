import { notification } from 'antd';
import { useCallback, useState } from 'react';

export const useNotification = () => {
  const [ error, setError ] = useState( null );
  const [ loading, setLoading ] = useState( false );

  const showSuccess = useCallback( ( message, description ) => {
    notification.success( {
      message,
      description,
      duration: 2
    } );
  }, [] );

  const showError = useCallback( ( message, description ) => {
    notification.error( {
      message,
      description,
      duration: 2
    } );
    setError( message );
  }, [] );

  const clearError = useCallback( () => {
    setError( null );
  }, [] );

  return {
    showSuccess,
    showError,
    clearError,
    error,
    loading
  };
};
