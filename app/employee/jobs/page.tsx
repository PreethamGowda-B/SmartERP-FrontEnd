"use client";

import React, { useEffect, useState } from "react";

interface Job {
  id: string;
  title: string;
  description: string;
  __created_by?: string;
}

export default function EmployeeJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch jobs from backend
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token"); // assumes JWT stored in localStorage
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch jobs (${res.status})`);
      }

      const data = await res.json();
      setJobs(data);
    } catch (err: any) {
      console.error("Error fetching jobs:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    // Optional: auto-refresh every 10 seconds
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading jobs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Available Jobs</h1>

      {jobs.length === 0 ? (
        <p className="text-gray-500 text-center">No jobs available yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border rounded-xl p-4 shadow hover:shadow-lg transition-all"
            >
              <h2 className="text-lg font-semibold mb-2">{job.title}</h2>
              <p className="text-gray-600 mb-3">{job.description}</p>
              {job.__created_by && (
                <p className="text-sm text-gray-400">
                  Created by: {job.__created_by}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
