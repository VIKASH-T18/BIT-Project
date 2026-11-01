/**
 * @file HostelMapPage.jsx
 * @description Interactive Campus & Hostel Floor Map Navigator — visualize blocks,
 * floors, and room availability live.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  MapPin, Building, Home, Users, CheckCircle2, AlertTriangle,
  Info, Compass, Phone, Mail, Shield
} from "lucide-react";
import api from "../../services/api";

const ROOM_STATUS_COLORS = {
  available: "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/25",
  occupied: "bg-blue-500/15 border-blue-500/30 text-blue-600 hover:bg-blue-500/25",
  partially_occupied: "bg-cyan-500/15 border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/25",
  maintenance: "bg-amber-500/15 border-amber-500/30 text-amber-600 hover:bg-amber-500/25",
};

const HostelMapPage = () => {
  const [selectedHostelId, setSelectedHostelId] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Fetch hostels
  const { data: hostels = [], isLoading: isLoadingHostels } = useQuery({
    queryKey: ["hostels-list"],
    queryFn: async () => {
      const res = await api.get("/hostels");
      return res.data?.data || [];
    },
  });

  // Set default hostel
  const activeHostelId = selectedHostelId || hostels[0]?._id;

  // Fetch layout for selected hostel
  const { data: layoutData, isLoading: isLoadingLayout } = useQuery({
    queryKey: ["hostel-layout", activeHostelId],
    queryFn: async () => {
      if (!activeHostelId) return null;
      const res = await api.get(`/hostels/${activeHostelId}/layout`);
      return res.data?.data;
    },
    enabled: !!activeHostelId,
  });

  const hostel = layoutData?.hostel || hostels.find((h) => h._id === activeHostelId);
  const blocks = layoutData?.blocks || [];
  const rooms = layoutData?.rooms || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-12"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black font-display text-light-text dark:text-dark-text flex items-center gap-3">
          <span className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
            <Compass className="w-8 h-8" />
          </span>
          Hostel Campus Map & Floor Navigator
        </h1>
        <p className="text-light-muted dark:text-dark-muted mt-1">
          Explore campus hostel buildings, wing layouts, and live room vacancy status.
        </p>
      </div>

      {/* Hostel Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoadingHostels ? (
          <div className="col-span-3 card py-8 text-center text-xs text-light-muted">
            Loading hostel facilities...
          </div>
        ) : hostels.length === 0 ? (
          <div className="col-span-3 card py-8 text-center text-xs text-light-muted">
            No hostels registered.
          </div>
        ) : (
          hostels.map((h) => {
            const isSelected = h._id === activeHostelId;
            return (
              <button
                key={h._id}
                onClick={() => {
                  setSelectedHostelId(h._id);
                  setSelectedRoom(null);
                }}
                className={`card p-5 text-left transition-all ${
                  isSelected
                    ? "border-2 border-primary-500 shadow-md ring-2 ring-primary-500/10"
                    : "hover:border-primary-500/40"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                    <Building className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                    {h.type} Hostel
                  </span>
                </div>
                <h3 className="font-bold text-base text-light-text dark:text-dark-text">
                  {h.name}
                </h3>
                <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
                  {h.description || "Main campus residence hall"}
                </p>
                <div className="mt-4 pt-3 border-t border-light-border dark:border-dark-border flex items-center justify-between text-xs text-light-muted">
                  <span>Capacity: {h.totalCapacity || 120} beds</span>
                  <span className="font-semibold text-primary-500">
                    {h.blocks?.length || 1} Blocks
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Main Interactive Map & Floor View */}
      {hostel && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Floor & Rooms Grid */}
          <div className="lg:col-span-2 card p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-light-border dark:border-dark-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-light-text dark:text-dark-text">
                  {hostel.name} — Room Layout
                </h3>
                <p className="text-xs text-light-muted dark:text-dark-muted">
                  Click on any room unit to inspect occupancy and amenities
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
                </span>
                <span className="flex items-center gap-1 text-blue-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Occupied
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Maintenance
                </span>
              </div>
            </div>

            {isLoadingLayout ? (
              <div className="py-20 text-center text-xs text-light-muted">
                Loading floor plans...
              </div>
            ) : rooms.length === 0 ? (
              <div className="py-16 text-center text-light-muted dark:text-dark-muted">
                <Home className="w-10 h-10 mx-auto mb-2 opacity-40 text-primary-500" />
                <p className="text-sm font-semibold">No rooms mapped in this hostel yet</p>
                <p className="text-xs mt-1">Add rooms via Admin Room Management</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Group by blocks */}
                {blocks.map((block) => {
                  const blockRooms = rooms.filter(
                    (r) => r.block?.toString() === block._id.toString()
                  );
                  if (blockRooms.length === 0) return null;

                  return (
                    <div key={block._id} className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted flex items-center gap-2">
                        <Building className="w-4 h-4 text-primary-500" />
                        {block.name} (Code: {block.blockCode || "A"})
                      </h4>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                        {blockRooms.map((rm) => {
                          const statusClass =
                            ROOM_STATUS_COLORS[rm.status] || ROOM_STATUS_COLORS.available;
                          const isSelected = selectedRoom?._id === rm._id;

                          return (
                            <button
                              key={rm._id}
                              onClick={() => setSelectedRoom(rm)}
                              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${statusClass} ${
                                isSelected ? "ring-2 ring-primary-500 font-black scale-105" : ""
                              }`}
                            >
                              <span className="text-xs font-black">{rm.roomNumber}</span>
                              <span className="text-[10px] opacity-80 mt-0.5 capitalize">
                                {rm.roomType || "2-Bed"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Col: Selected Room / Facility Details */}
          <div className="space-y-6">
            {/* Selected Room Card */}
            <div className="card p-6">
              <h3 className="text-base font-bold text-light-text dark:text-dark-text border-b border-light-border dark:border-dark-border pb-3 mb-4">
                Unit Inspection
              </h3>

              {selectedRoom ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-light-muted dark:text-dark-muted">Room Number:</span>
                    <span className="font-bold text-sm text-light-text dark:text-dark-text">
                      {selectedRoom.roomNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-light-muted dark:text-dark-muted">Floor:</span>
                    <span className="font-bold text-light-text dark:text-dark-text">
                      Floor {selectedRoom.floorNumber || 1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-light-muted dark:text-dark-muted">Current Status:</span>
                    <span className="font-bold capitalize text-primary-500">
                      {selectedRoom.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-light-muted dark:text-dark-muted">Beds Capacity:</span>
                    <span className="font-bold text-light-text dark:text-dark-text">
                      {selectedRoom.capacity || 2} Beds
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-light-muted dark:text-dark-muted">Current Occupancy:</span>
                    <span className="font-bold text-light-text dark:text-dark-text">
                      {selectedRoom.currentOccupancy || 0} Students
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-light-muted dark:text-dark-muted">
                  <Home className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary-500" />
                  <p className="text-xs">Click on any room number from the floor map to see details.</p>
                </div>
              )}
            </div>

            {/* Hostel Amenities & Rules */}
            <div className="card p-6 space-y-4">
              <h3 className="text-base font-bold text-light-text dark:text-dark-text border-b border-light-border dark:border-dark-border pb-3">
                Building Facilities
              </h3>
              <div className="space-y-2 text-xs text-light-muted dark:text-dark-muted">
                <p>✔ High-Speed Wi-Fi Enabled Zones</p>
                <p>✔ 24/7 Filtered RO Water Station</p>
                <p>✔ Common Study Hall & Recreation Lounge</p>
                <p>✔ CCTV Monitored Entry & Exit Gates</p>
                <p>✔ Automatic Laundry Room</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default HostelMapPage;