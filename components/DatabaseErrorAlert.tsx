'use client';

interface DatabaseErrorAlertProps {
  show: boolean;
  onClose?: () => void;
}

export default function DatabaseErrorAlert({ show, onClose }: DatabaseErrorAlertProps) {
  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full mx-4">
      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg p-4 animate-in slide-in-from-top duration-300">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-red-800">
              База данных не запущена!
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Невозможно подключиться к базе данных PostgreSQL.</p>
              <p className="mt-1">
                Убедитесь, что контейнер базы данных запущен и доступен.
              </p>
            </div>
            <div className="mt-3">
              <details className="text-xs text-red-600">
                <summary className="cursor-pointer hover:text-red-800 font-medium">
                  Как запустить базу данных?
                </summary>
                <div className="mt-2 bg-red-100 p-2 rounded">
                  <p className="mb-1">Выполните одну из команд:</p>
                  <code className="block bg-white p-2 rounded mt-1">
                    docker-compose up -d postgres
                  </code>
                  <code className="block bg-white p-2 rounded mt-1">
                    make db-start
                  </code>
                </div>
              </details>
            </div>
          </div>
          {onClose && (
            <div className="ml-auto pl-3">
              <button
                onClick={onClose}
                className="inline-flex text-red-400 hover:text-red-600 focus:outline-none"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
