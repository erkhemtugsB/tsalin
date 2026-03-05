import { useState } from "react";
import Hero from "../components/Hero";
import Form from "../components/Form";
import Result from "../components/Result";

export default function Home() {
  const [result, setResult] = useState(null);

  return (
    <div className="space-y-6">
      {!result ? (
        <Hero>
          <Form onCalculated={setResult} compact />
        </Hero>
      ) : (
        <Result
          netWorth={result.netWorth}
          percentile={result.percentile}
          netWorthPercentile={result.netWorthPercentile}
          salaryPercentile={result.salaryPercentile}
          payload={result.payload}
          infoMessage={result.infoMessage}
          onReset={() => setResult(null)}
        />
      )}
    </div>
  );
}
