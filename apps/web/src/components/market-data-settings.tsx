"use client";

import { useState } from "react";
import { useApi, postJson } from "@/lib/use-api";
import type { MarketConnection } from "@/lib/market-data";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { OptionSelect } from "./ui/option-select";
import { providerInfo } from "@/lib/market-providers";
import { MarketCsvSettings } from "./market-csv-settings";

export function MarketDataSettings() {
  const { data, error, refresh } = useApi<{ connections: MarketConnection[] }>(
    "/api/market-data/connections",
  );
  return (
    <Card id="market-data" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Market data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect historical prices for estimated MAE/MFE and candle replay on closed trades. Vela
          renders the charts. No data source is enabled or selected by default. Choose a connection
          or upload your own candles. Market data connections are separate from broker sync and AI.
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!data && !error && <p className="text-sm text-muted-foreground">Loading connections…</p>}
        {data?.connections
          .filter((connection) => connection.id !== "market-csv")
          .map((connection) => (
            <Connection key={connection.id} connection={connection} refresh={refresh} />
          ))}
        <MarketCsvSettings onChange={refresh} />
      </CardContent>
    </Card>
  );
}

function Connection({
  connection,
  refresh,
}: {
  connection: MarketConnection;
  refresh: () => void;
}) {
  const info = providerInfo(connection.id)!;
  const defaults = () =>
    Object.fromEntries(info.fields.map((field) => [field.key, field.defaultValue ?? ""]));
  const [fields, setFields] = useState<Record<string, string>>(defaults);
  const publicSource = info.mode === "public";
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const managed = connection.source === "environment";
  const act = async (action: "save" | "remove" | "test" | "enable") => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await postJson("/api/market-data/connections", {
        provider: connection.id,
        action,
        ...(action === "save" ? { credentials: fields } : {}),
      });
      setFields(defaults());
      setMessage(
        action === "test"
          ? publicSource
            ? "Public endpoint reachable. No API key or paid data plan is required. Candle availability depends on the pair, date range and public API limits."
            : "Connection verified. Instrument coverage depends on your provider access."
          : action === "save"
            ? "Credentials saved. Test the connection to verify access."
            : action === "enable"
              ? "Public market data enabled."
              : "Connection removed.",
      );
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connection update failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-3 rounded-lg inset-outline p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{connection.name}</h3>
        <span className="text-xs text-muted-foreground">
          {managed
            ? "Managed by server environment"
            : connection.configured
              ? publicSource
                ? "Enabled · no key required"
                : "Credentials saved"
              : "Not connected"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{info.description}</p>
      {!publicSource && (
        <p className="text-xs text-muted-foreground">
          Credentials are encrypted locally and used only by the server for market data. Saved
          secrets are never returned to the browser or included in journal exports.
        </p>
      )}
      {managed && !connection.configured && (
        <p className="text-xs text-destructive">
          Complete all required fields in the server environment.
        </p>
      )}
      {!managed &&
        !publicSource &&
        info.fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={`key-${connection.id}-${field.key}`}>{field.label}</Label>
            {field.options ? (
              <OptionSelect
                id={`key-${connection.id}-${field.key}`}
                value={fields[field.key] ?? ""}
                disabled={busy}
                onValueChange={(value) =>
                  setFields((current) => ({ ...current, [field.key]: value }))
                }
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </OptionSelect>
            ) : (
              <Input
                id={`key-${connection.id}-${field.key}`}
                type="password"
                value={fields[field.key] ?? ""}
                onChange={(event) =>
                  setFields((current) => ({ ...current, [field.key]: event.target.value }))
                }
                placeholder={
                  connection.configured
                    ? `Enter replacement ${field.label.toLowerCase()}`
                    : `Enter ${field.label.toLowerCase()}`
                }
                autoComplete="off"
                spellCheck={false}
                disabled={busy}
              />
            )}
          </div>
        ))}
      <div className="flex flex-wrap gap-2">
        {!managed && !publicSource && (
          <Button
            disabled={busy || info.fields.some((field) => !fields[field.key]?.trim())}
            onClick={() => void act("save")}
          >
            Save credentials
          </Button>
        )}
        {publicSource && !connection.configured && (
          <Button disabled={busy} onClick={() => void act("enable")}>
            Enable source
          </Button>
        )}
        {connection.configured && (
          <Button variant="outline" disabled={busy} onClick={() => void act("test")}>
            Test connection
          </Button>
        )}
        {connection.configured && !managed && (
          <Button variant="outline" disabled={busy} onClick={() => void act("remove")}>
            {publicSource ? "Disable source" : "Remove credentials"}
          </Button>
        )}
      </div>
      {message && (
        <p role="status" className="text-xs text-muted-foreground">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
