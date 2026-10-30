"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  ApiRequestError,
  createUnit,
  createUnitsBulk,
  getPropertyById,
  getPropertyUnits,
  updateProperty,
  type Property,
} from "../../lib/onboarding";

export default function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const queryClient = useQueryClient();
  const [unit, setUnit] = useState({
    unitNumber: "",
    bedrooms: "",
    bathrooms: "",
    monthlyRent: "",
    status: "AVAILABLE",
  });
  const [bulk, setBulk] = useState({
    unitNumbers: "",
    bedrooms: "",
    bathrooms: "",
    monthlyRent: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const propertyQuery = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => getPropertyById(propertyId),
    enabled: Boolean(propertyId),
  });
  const unitsQuery = useQuery({
    queryKey: ["property-units", propertyId],
    queryFn: () => getPropertyUnits(propertyId),
    enabled: Boolean(propertyId),
  });

  async function refreshUnits() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["property-units", propertyId] }),
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
  }

  async function submitUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createUnit(propertyId, {
        unitNumber: unit.unitNumber,
        bedrooms: optionalNumber(unit.bedrooms),
        bathrooms: optionalNumber(unit.bathrooms),
        monthlyRent: Number(unit.monthlyRent),
        status: unit.status,
      });
      setUnit({
        unitNumber: "",
        bedrooms: "",
        bathrooms: "",
        monthlyRent: "",
        status: "AVAILABLE",
      });
      await refreshUnits();
    } catch (actionError) {
      setError(
        actionError instanceof ApiRequestError
          ? actionError.message
          : "The unit could not be added.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitBulk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const unitNumbers = bulk.unitNumbers
        .split(",")
        .map((number) => number.trim())
        .filter(Boolean);
      if (unitNumbers.length === 0 || unitNumbers.length > 100) {
        throw new Error("Enter between 1 and 100 comma-separated unit numbers.");
      }
      const units = unitNumbers.map((unitNumber) => ({
        unitNumber,
        bedrooms: optionalNumber(bulk.bedrooms),
        bathrooms: optionalNumber(bulk.bathrooms),
        monthlyRent: Number(bulk.monthlyRent),
        status: "AVAILABLE",
      }));
      await createUnitsBulk(propertyId, units);
      setBulk({ unitNumbers: "", bedrooms: "", bathrooms: "", monthlyRent: "" });
      await refreshUnits();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "The units could not be added.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (propertyQuery.isLoading || unitsQuery.isLoading) {
    return <Loading />;
  }
  if (propertyQuery.isError || unitsQuery.isError || !propertyQuery.data || !unitsQuery.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-6 text-[#17231f]">
        <section className="max-w-lg rounded-3xl border border-[#e1e7e1] bg-white p-8">
          <h1 className="text-2xl font-semibold">Property could not be loaded</h1>
          <p className="mt-3 text-sm leading-6 text-[#68756f]" role="alert">
            {propertyQuery.error instanceof Error
              ? propertyQuery.error.message
              : unitsQuery.error instanceof Error
                ? unitsQuery.error.message
                : "Please try again."}
          </p>
          <Link className="mt-6 inline-flex text-sm font-semibold text-[#1d5745]" href="/dashboard">
            Return to dashboard
          </Link>
        </section>
      </main>
    );
  }

  const propertyDetails = propertyQuery.data.property;
  const inputClass =
    "mt-2 h-11 w-full rounded-xl border border-[#dce3de] bg-white px-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10";

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-5 py-8 text-[#17231f] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link className="text-sm font-semibold text-[#52735c] hover:underline" href="/dashboard">
          ← Dashboard
        </Link>
        <header className="mt-6 border-b border-[#e2e8e2] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
            {propertyDetails.type.toLowerCase().replace("_", " ")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            {propertyDetails.name}
          </h1>
          <p className="mt-2 text-sm text-[#738078]">
            {propertyDetails.addressLine1}, {propertyDetails.city}
          </p>
        </header>

        <UpdatePropertyForm
          property={propertyDetails}
          onSaved={() => {
            void Promise.all([
              queryClient.invalidateQueries({ queryKey: ["property", propertyId] }),
              queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
            ]);
          }}
        />

        {error && (
          <p className="mt-6 rounded-xl border border-[#f1c7c4] bg-[#fff5f4] px-4 py-3 text-sm text-[#a12a21]" role="alert">
            {error}
          </p>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-[#e2e8e2] bg-white p-6">
            <h2 className="text-lg font-semibold">Units</h2>
            <p className="mt-1 text-sm text-[#738078]">
              {unitsQuery.data.units.length} in this property
            </p>
            {unitsQuery.data.units.length ? (
              <ul className="mt-5 divide-y divide-[#edf0ec]">
                {unitsQuery.data.units.map((item) => (
                  <li className="flex items-center justify-between gap-4 py-4" key={item.id}>
                    <div>
                      <p className="font-semibold text-[#25342e]">Unit {item.unitNumber}</p>
                      <p className="mt-1 text-xs text-[#738078]">
                        {formatRooms(item.bedrooms, item.bathrooms)} · {item.status.toLowerCase()}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#365842]">
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(Number(item.monthlyRent))}
                      /mo
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 rounded-xl bg-[#f7f8f6] p-4 text-sm text-[#68756f]">
                No units have been added to this property yet.
              </p>
            )}
          </div>

          <div className="space-y-6">
            <form className="rounded-2xl border border-[#e2e8e2] bg-white p-6" onSubmit={submitUnit}>
              <h2 className="text-lg font-semibold">Add a unit</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Unit number" value={unit.unitNumber} onChange={(unitNumber) => setUnit({ ...unit, unitNumber })} required />
                <Field label="Monthly rent" type="number" min="0" step="0.01" value={unit.monthlyRent} onChange={(monthlyRent) => setUnit({ ...unit, monthlyRent })} required />
                <Field label="Bedrooms" type="number" min="0" step="0.5" value={unit.bedrooms} onChange={(bedrooms) => setUnit({ ...unit, bedrooms })} />
                <Field label="Bathrooms" type="number" min="0" step="0.5" value={unit.bathrooms} onChange={(bathrooms) => setUnit({ ...unit, bathrooms })} />
              </div>
              <label className="mt-4 block text-sm font-medium text-[#25342e]">
                Availability
                <select
                  className={inputClass}
                  onChange={(event) => setUnit({ ...unit, status: event.target.value })}
                  value={unit.status}
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
              <button
                className="mt-5 h-11 rounded-xl bg-[#1d5745] px-5 text-sm font-semibold text-white disabled:opacity-60"
                disabled={busy}
                type="submit"
              >
                {busy ? "Saving..." : "Add unit"}
              </button>
            </form>

            <form className="rounded-2xl border border-[#e2e8e2] bg-white p-6" onSubmit={submitBulk}>
              <h2 className="text-lg font-semibold">Add units in bulk</h2>
              <p className="mt-1 text-sm leading-5 text-[#738078]">
                Add up to 100 unit numbers with shared rent and room details.
              </p>
              <label className="mt-4 block text-sm font-medium text-[#25342e]">
                Unit numbers
                <input
                  className={inputClass}
                  onChange={(event) => setBulk({ ...bulk, unitNumbers: event.target.value })}
                  placeholder="1A, 1B, 2A"
                  required
                  value={bulk.unitNumbers}
                />
              </label>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Monthly rent" type="number" min="0" step="0.01" value={bulk.monthlyRent} onChange={(monthlyRent) => setBulk({ ...bulk, monthlyRent })} required />
                <Field label="Bedrooms" type="number" min="0" step="0.5" value={bulk.bedrooms} onChange={(bedrooms) => setBulk({ ...bulk, bedrooms })} />
                <Field label="Bathrooms" type="number" min="0" step="0.5" value={bulk.bathrooms} onChange={(bathrooms) => setBulk({ ...bulk, bathrooms })} />
              </div>
              <button
                className="mt-5 h-11 rounded-xl border border-[#cad8ce] px-5 text-sm font-semibold text-[#28583b] disabled:opacity-60"
                disabled={busy}
                type="submit"
              >
                {busy ? "Saving..." : "Add units"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function UpdatePropertyForm({
  property,
  onSaved,
}: {
  property: Property;
  onSaved: () => void;
}) {
  const [values, setValues] = useState({
    name: property.name,
    type: property.type,
    addressLine1: property.addressLine1,
    city: property.city,
    region: property.region ?? "",
    postalCode: property.postalCode ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await updateProperty(property.id, values);
      setSaved(true);
      onSaved();
    } catch (actionError) {
      setError(
        actionError instanceof ApiRequestError
          ? actionError.message
          : "Property details could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "mt-2 h-11 w-full rounded-xl border border-[#dce3de] bg-white px-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10";

  return (
    <details className="mt-6 rounded-2xl border border-[#e2e8e2] bg-white p-5 sm:p-6">
      <summary className="cursor-pointer text-sm font-semibold text-[#365842]">
        Edit property details
      </summary>
      {error && (
        <p
          className="mt-4 rounded-xl border border-[#f1c7c4] bg-[#fff5f4] px-4 py-3 text-sm text-[#a12a21]"
          role="alert"
        >
          {error}
        </p>
      )}
      {saved && (
        <p className="mt-4 text-sm text-[#28583b]" role="status">
          Property details saved.
        </p>
      )}
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <Field
          label="Property name"
          value={values.name}
          onChange={(name) => setValues({ ...values, name })}
          required
        />
        <label className="block text-sm font-medium text-[#25342e]">
          Property type
          <select
            className={inputClass}
            onChange={(event) => setValues({ ...values, type: event.target.value })}
            value={values.type}
          >
            <option value="APARTMENT">Apartment</option>
            <option value="HOUSE">House</option>
            <option value="CONDO">Condo</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <Field
          label="Street address"
          value={values.addressLine1}
          onChange={(addressLine1) => setValues({ ...values, addressLine1 })}
          required
        />
        <Field
          label="City"
          value={values.city}
          onChange={(city) => setValues({ ...values, city })}
          required
        />
        <Field
          label="State / region"
          value={values.region}
          onChange={(region) => setValues({ ...values, region })}
        />
        <Field
          label="Postal code"
          value={values.postalCode}
          onChange={(postalCode) => setValues({ ...values, postalCode })}
        />
        <button
          className="h-11 w-fit rounded-xl bg-[#1d5745] px-5 text-sm font-semibold text-white disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          {busy ? "Saving..." : "Save property"}
        </button>
      </form>
    </details>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <label className="block text-sm font-medium text-[#25342e]">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-xl border border-[#dce3de] bg-white px-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10"
        min={min}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        step={step}
        type={type}
        value={value}
      />
    </label>
  );
}

function optionalNumber(value: string) {
  return value.trim() ? Number(value) : null;
}

function formatRooms(bedrooms: number | string | null, bathrooms: number | string | null) {
  const beds = bedrooms === null ? "Studio" : `${bedrooms} bed`;
  const baths = bathrooms === null ? "bath count not set" : `${bathrooms} bath`;
  return `${beds}, ${baths}`;
}

function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] text-sm text-[#68756f]">
      Loading property...
    </main>
  );
}
