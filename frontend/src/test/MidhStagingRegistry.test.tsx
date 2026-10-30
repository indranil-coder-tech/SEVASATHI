import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppProvider } from '../context/AppContext';
import { MidhStagingRegistry } from '../components/MidhStagingRegistry';
import * as api from '../services/api';
import type { MidhStagingResponse } from '../types';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    fetchMidhStagingProjects: vi.fn(),
  };
});

describe('MidhStagingRegistry Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResponse: MidhStagingResponse = {
    projects: [
      {
        project_id: 'MIDH-MH-001',
        sr_no: 1,
        district_raw: 'NASHIK',
        district_normalized: 'Nashik',
        financial_year: '2021-22',
        beneficiary_name_raw: 'Shree Ganesh Cold Storage Ltd',
        address_raw: 'At Post Dindori, Dist Nashik',
        taluka_normalized: 'Dindori',
        pincode: '422202',
        subsidy_disbursed_lakh_inr: 140.0,
        capacity_mt: 5000,
        source_document: 'MIDH Maharashtra Official Release',
        source_page: 12,
        record_type: 'Cold Storage',
        operational_status: 'Completed',
        verification_status: 'Govt_Disbursed',
        review_flags: 'NHB_Assisted',
        notes: 'Verified subsidy disbursement',
      },
    ],
    total_filtered: 1,
    summary: {
      total_projects: 183,
      total_capacity_mt: 450200,
      total_subsidy_lakh_inr: 15400,
      review_flags_count: 5,
      districts_count: 22,
      years_covered: '2014-2024',
      data_integrity_notice: 'Official archived records',
    },
  };

  it('renders summary statistics and filtered projects list', async () => {
    vi.mocked(api.fetchMidhStagingProjects).mockResolvedValue(mockResponse);

    render(
      <AppProvider>
        <MidhStagingRegistry />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Shree Ganesh Cold Storage Ltd')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Dindori/).length).toBeGreaterThan(0);
  });

  it('handles search query filter change', async () => {
    vi.mocked(api.fetchMidhStagingProjects).mockResolvedValue(mockResponse);

    render(
      <AppProvider>
        <MidhStagingRegistry />
      </AppProvider>
    );

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'Nashik' } });

    await waitFor(() => {
      expect(api.fetchMidhStagingProjects).toHaveBeenCalled();
    });
  });
});
