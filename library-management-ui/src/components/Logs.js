import React, { useEffect, useState } from "react";
import axios from "axios";

function Logs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/logs`) // Management portunu kontrol edin
      .then((response) => {
        console.log(response.data); // API yanıtını konsola logla
        setLogs(response.data);
      })
      .catch((error) =>
        console.error("There was an error fetching the logs!", error)
      ); // Hata durumunda logla
  }, []);

  return (
    <div>
      <h2>Logs</h2>
      <ul>
        {logs.map((log) => (
          <li key={log.timestamp}>
            {log.timestamp} - {log.title} - {log.borrowerName} - {log.status} -{" "}
            {log.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Logs;
