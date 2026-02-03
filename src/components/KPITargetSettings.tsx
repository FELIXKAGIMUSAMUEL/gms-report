"use client";

import { useState } from "react";
import { XMarkIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

interface KPITargets {
  feesCollectionPercent: number;
  schoolsExpenditurePercent: number;
  infrastructurePercent: number;
  p7PrepExamsPercent: number;
  syllabusCoveragePercent: number;
  totalEnrollment?: number;
  theologyEnrollment?: number;
  admissions?: number;
}

interface Props {
  targets: KPITargets;
  onUpdate: (targets: KPITargets) => void;
}

const DEFAULT_TARGETS: KPITargets = {
  feesCollectionPercent: 100,
  schoolsExpenditurePercent: 85,
  infrastructurePercent: 80,
  p7PrepExamsPercent: 90,
  syllabusCoveragePercent: 95,
};

export default function KPITargetSettings({ targets, onUpdate }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editTargets, setEditTargets] = useState<KPITargets>(targets);

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem("kpiTargets", JSON.stringify(editTargets));
    onUpdate(editTargets);
    setShowModal(false);
  };

  const handleReset = () => {
    setEditTargets(DEFAULT_TARGETS);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
        title="Configure KPI Targets"
      >
        <Cog6ToothIcon className="w-5 h-5" />
        <span className="hidden sm:inline">Targets</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Configure KPI Targets</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">How Targets Work</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• KPI cards show <strong>progress bars</strong> toward your targets</li>
                      <li>• Cards turn <strong className="text-green-600">green with a checkmark</strong> when targets are met</li>
                      <li>• Progress bar colors: <span className="text-red-600 font-medium">red</span> (&lt;50%), <span className="text-yellow-600 font-medium">yellow</span> (50-79%), <span className="text-blue-600 font-medium">blue</span> (80-99%), <span className="text-green-600 font-medium">green</span> (100%+)</li>
                      <li>• Optional targets (enrollment) won&apos;t show progress bars if left empty</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Set target values for each KPI. These will be used to track performance against goals.
              </p>

              {/* Financial KPIs */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Financial KPIs</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fees Collection % Target
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editTargets.feesCollectionPercent}
                      onChange={(e) => setEditTargets(prev => ({ ...prev, feesCollectionPercent: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schools Expenditure % Target
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editTargets.schoolsExpenditurePercent}
                      onChange={(e) => setEditTargets(prev => ({ ...prev, schoolsExpenditurePercent: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Infrastructure % Target
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editTargets.infrastructurePercent}
                      onChange={(e) => setEditTargets(prev => ({ ...prev, infrastructurePercent: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Academic KPIs */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Academic KPIs</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      P7 Prep Exams % Target
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editTargets.p7PrepExamsPercent}
                      onChange={(e) => setEditTargets(prev => ({ ...prev, p7PrepExamsPercent: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Syllabus Coverage % Target
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editTargets.syllabusCoveragePercent}
                      onChange={(e) => setEditTargets(prev => ({ ...prev, syllabusCoveragePercent: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Enrollment Targets (Optional) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Enrollment Targets <span className="text-sm font-normal text-gray-500">(Optional)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Enrollment Target
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editTargets.totalEnrollment || ""}
                      onChange={(e) => setEditTargets(prev => ({ ...prev, totalEnrollment: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theology Enrollment Target
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editTargets.theologyEnrollment || ""}
                      onChange={(e) => setEditTargets(prev => ({ ...prev, theologyEnrollment: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admissions Target
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editTargets.admissions || ""}
                      onChange={(e) => setEditTargets(prev => ({ ...prev, admissions: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Reset to Defaults
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Save Targets
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
