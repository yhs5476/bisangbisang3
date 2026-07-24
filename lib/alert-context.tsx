"use client";

import React, { createContext, useContext, useState } from "react";
import { DisasterType } from "./alert-actions";

interface AlertContextType {
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
  disasterType: DisasterType;
  setDisasterType: (type: DisasterType) => void;
  isAlertActive: boolean;
  setIsAlertActive: (active: boolean) => void;
  enableGps: boolean;
  setEnableGps: (enable: boolean) => void;
}

const AlertContext = createContext<AlertContextType>({
  demoMode: true,
  setDemoMode: () => {},
  disasterType: "earthquake",
  setDisasterType: () => {},
  isAlertActive: false,
  setIsAlertActive: () => {},
  enableGps: true,
  setEnableGps: () => {},
});

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [disasterType, setDisasterType] = useState<DisasterType>("earthquake");
  const [isAlertActive, setIsAlertActive] = useState<boolean>(false);
  const [enableGps, setEnableGps] = useState<boolean>(true);

  return (
    <AlertContext.Provider
      value={{
        demoMode,
        setDemoMode,
        disasterType,
        setDisasterType,
        isAlertActive,
        setIsAlertActive,
        enableGps,
        setEnableGps,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}
