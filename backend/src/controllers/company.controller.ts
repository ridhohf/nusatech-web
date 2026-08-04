import { Request, Response } from 'express';
import { companyService } from '../services/company.service';

export const getCompanies = async (_req: Request, res: Response) => {
  try {
    const companies = await companyService.getAllCompanies();
    res.json(companies);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createCompany = async (req: Request, res: Response) => {
  try {
    const { name, regionCode, contact, phone, address } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Company name is required.' });
    }
    const company = await companyService.createCompany({
      name: name.trim(),
      regionCode: regionCode || '65',
      contact,
      phone,
      address,
    });
    res.status(201).json(company);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
