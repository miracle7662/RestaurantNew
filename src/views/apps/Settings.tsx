import React, { useState } from "react";
import { 
  Settings, Printer, Keyboard, User, PanelsTopLeft 
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { key: "general", label: "General", icon: Settings },
    { key: "printer", label: "Printer", icon: Printer },
    { key: "shortcuts", label: "Shortcuts", icon: Keyboard },
    { key: "profile", label: "Profile", icon: User },
    { key: "formatting", label: "Formatting", icon: PanelsTopLeft },
  ];

  return (
    <div className="w-full h-full bg-gray-100 p-6 flex justify-center">

      <div className="w-full max-w-6xl bg-white rounded-xl shadow-md flex overflow-hidden">

        {/* LEFT SIDE MENU */}
        <div className="w-64 border-r bg-gray-50">
          <h2 className="text-lg font-semibold px-6 py-4 border-b bg-white">
            Settings
          </h2>

          <div className="flex flex-col py-4">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-3 px-6 py-3 text-sm font-medium 
                            transition-all rounded-r-full mb-1
                  ${activeTab === t.key
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-700 hover:bg-gray-200"}
                `}
              >
                <t.icon size={18} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE CONTENT */}
        <div className="flex-1 p-8 bg-white">
          {activeTab === "general" && <GeneralTab />}
          {activeTab === "printer" && <PrinterTab />}
          {activeTab === "shortcuts" && <ShortcutsTab />}
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "formatting" && <FormattingTab />}
        </div>

      </div>
    </div>
  );
}

/* ---------------- CONTENT COMPONENTS ---------------- */

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-2xl font-bold mb-6">{title}</h2>;
}

function GeneralTab() {
  return (
    <div>
      <SectionTitle title="General Settings" />
      <p className="text-gray-600">
        Add global configuration options here...
      </p>
    </div>
  );
}

function PrinterTab() {
  return (
    <div>
      <SectionTitle title="Printer / KOT Settings" />
      <p className="text-gray-600">
        KOT print, bill print, printer mapping settings...
      </p>
    </div>
  );
}

function ShortcutsTab() {
  return (
    <div>
      <SectionTitle title="Keyboard Shortcuts" />
      <p className="text-gray-600">
        Configure keyboard actions for fast billing.
      </p>
    </div>
  );
}

function ProfileTab() {
  return (
    <div>
      <SectionTitle title="Profile Settings" />
      <p className="text-gray-600">
        User info, password update, roles, etc.
      </p>
    </div>
  );
}

function FormattingTab() {
  return (
    <div>
      <SectionTitle title="Formatting Settings" />
      <p className="text-gray-600">
        Customize bill/KOT format & UI layout.
      </p>
    </div>
  );
}
