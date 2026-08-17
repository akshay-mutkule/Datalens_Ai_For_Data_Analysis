export interface SampleDatasetMeta {
  id: string;
  name: string;
  category: string;
  description: string;
  rowsCount: number;
  colsCount: number;
  fileName: string;
  generator: () => Record<string, any>[];
}

export const SAMPLE_DATASETS: SampleDatasetMeta[] = [
  {
    id: 'ecommerce_sales',
    name: 'Global E-Commerce & Retail Performance',
    category: 'Sales & Revenue',
    description: 'Retail orders with sales, profit, product categories, regions, discounts, and customer segments.',
    rowsCount: 250,
    colsCount: 10,
    fileName: 'global_ecommerce_retail.csv',
    generator: () => {
      const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
      const categories = [
        { cat: 'Technology', subs: ['Laptops', 'Smartphones', 'Accessories', 'Monitors'] },
        { cat: 'Office Supplies', subs: ['Paper', 'Binders', 'Storage', 'Appliances'] },
        { cat: 'Furniture', subs: ['Chairs', 'Tables', 'Bookcases', 'Furnishings'] },
      ];
      const segments = ['Consumer', 'Corporate', 'Home Office', 'Small Business'];
      const data: Record<string, any>[] = [];

      const startDate = new Date('2024-01-01').getTime();
      const endDate = new Date('2024-12-31').getTime();

      for (let i = 1; i <= 250; i++) {
        const randomTime = startDate + Math.random() * (endDate - startDate);
        const orderDate = new Date(randomTime).toISOString().split('T')[0];
        const region = regions[Math.floor(Math.random() * regions.length)];
        const catObj = categories[Math.floor(Math.random() * categories.length)];
        const category = catObj.cat;
        const subCategory = catObj.subs[Math.floor(Math.random() * catObj.subs.length)];
        const segment = segments[Math.floor(Math.random() * segments.length)];
        
        const quantity = Math.floor(Math.random() * 8) + 1;
        const basePrice = category === 'Technology' ? 250 + Math.random() * 950 : category === 'Furniture' ? 120 + Math.random() * 600 : 15 + Math.random() * 150;
        const discount = Math.random() > 0.6 ? Number((Math.random() * 0.25).toFixed(2)) : 0;
        const sales = Number((quantity * basePrice * (1 - discount)).toFixed(2));
        const profitMargin = category === 'Technology' ? 0.22 - discount : category === 'Furniture' ? 0.14 - discount : 0.28 - discount;
        const profit = Number((sales * profitMargin).toFixed(2));

        data.push({
          order_id: `ORD-${1000 + i}`,
          order_date: orderDate,
          customer_id: `CUST-${100 + (i % 65)}`,
          customer_segment: segment,
          region: region,
          category: category,
          sub_category: subCategory,
          quantity: quantity,
          sales: sales,
          discount: discount,
          profit: profit,
        });
      }

      // Add a few deliberate missing values & duplicates to test cleaning suggestions
      data[12].sales = null;
      data[45].discount = null;
      data[88].category = null;
      data.push({ ...data[5] }); // duplicate
      data.push({ ...data[22] }); // duplicate

      return data;
    },
  },
  {
    id: 'tech_hr',
    name: 'Tech Workforce & Salary Intelligence',
    category: 'Human Resources',
    description: 'Workforce records containing departments, job roles, salary bands, performance, and remote work status.',
    rowsCount: 200,
    colsCount: 9,
    fileName: 'tech_workforce_salaries.csv',
    generator: () => {
      const depts = ['Engineering', 'Product Management', 'Data Science', 'Marketing', 'Sales', 'Customer Success', 'HR & Ops'];
      const roles: Record<string, string[]> = {
        Engineering: ['Software Engineer', 'Senior Architect', 'DevOps Specialist', 'Frontend Dev'],
        'Product Management': ['Product Manager', 'Associate PM', 'Principal PM'],
        'Data Science': ['Data Scientist', 'ML Engineer', 'BI Analyst'],
        Marketing: ['Growth Lead', 'Content Strategist', 'SEO Specialist'],
        Sales: ['Account Executive', 'Sales Lead', 'SDR'],
        'Customer Success': ['CS Manager', 'Support Lead'],
        'HR & Ops': ['HR Partner', 'Talent Recruiter', 'Operations Lead'],
      };
      const remoteStatuses = ['Fully Remote', 'Hybrid (3 days)', 'On-Site', 'Flexible'];

      const data: Record<string, any>[] = [];
      const startDate = new Date('2021-01-01').getTime();
      const endDate = new Date('2024-06-30').getTime();

      for (let i = 1; i <= 200; i++) {
        const dept = depts[Math.floor(Math.random() * depts.length)];
        const roleList = roles[dept];
        const role = roleList[Math.floor(Math.random() * roleList.length)];
        const experienceYears = Math.floor(Math.random() * 14) + 1;
        const baseSalary = dept === 'Engineering' || dept === 'Data Science'
          ? 85000 + experienceYears * 8200 + Math.random() * 20000
          : 60000 + experienceYears * 5500 + Math.random() * 15000;
        const salary = Math.round(baseSalary / 500) * 500;
        const performanceRating = Number((3.2 + Math.random() * 1.7).toFixed(1));
        const remoteStatus = remoteStatuses[Math.floor(Math.random() * remoteStatuses.length)];
        const hireTime = startDate + Math.random() * (endDate - startDate);
        const hireDate = new Date(hireTime).toISOString().split('T')[0];
        const overtimeHours = Math.floor(Math.random() * 25);

        data.push({
          employee_id: `EMP-${5000 + i}`,
          department: dept,
          job_title: role,
          experience_years: experienceYears,
          salary: salary,
          performance_rating: Math.min(5.0, performanceRating),
          remote_status: remoteStatus,
          hire_date: hireDate,
          overtime_hours: overtimeHours,
        });
      }

      data[15].salary = null;
      data[70].department = null;
      data.push({ ...data[8] });

      return data;
    },
  },
  {
    id: 'saas_churn',
    name: 'SaaS Subscription & Churn Metrics',
    category: 'SaaS & Cloud',
    description: 'Monthly recurring revenue, tier levels, usage scores, customer health, and churn indications.',
    rowsCount: 220,
    colsCount: 8,
    fileName: 'saas_subscription_churn.csv',
    generator: () => {
      const plans = ['Starter', 'Growth', 'Enterprise', 'Ultimate'];
      const industries = ['FinTech', 'E-Commerce', 'Healthcare IT', 'EdTech', 'Logistics', 'Cybersecurity'];
      const data: Record<string, any>[] = [];

      const startDate = new Date('2023-01-01').getTime();
      const endDate = new Date('2024-11-01').getTime();

      for (let i = 1; i <= 220; i++) {
        const plan = plans[Math.floor(Math.random() * plans.length)];
        const industry = industries[Math.floor(Math.random() * industries.length)];
        const mrr = plan === 'Enterprise' ? 2400 + Math.random() * 3500
          : plan === 'Ultimate' ? 1200 + Math.random() * 1100
          : plan === 'Growth' ? 450 + Math.random() * 500
          : 99 + Math.random() * 150;
        const usageScore = Math.floor(40 + Math.random() * 60);
        const supportTickets = Math.floor(Math.random() * 12);
        const churnProbability = usageScore < 55 || supportTickets > 7 ? 'Yes' : 'No';
        const signupTime = startDate + Math.random() * (endDate - startDate);
        const signupDate = new Date(signupTime).toISOString().split('T')[0];

        data.push({
          account_id: `ACCT-${8000 + i}`,
          plan_type: plan,
          industry: industry,
          mrr: Number(mrr.toFixed(2)),
          usage_score: usageScore,
          support_tickets: supportTickets,
          churned: churnProbability,
          signup_date: signupDate,
        });
      }

      data[33].mrr = null;
      data.push({ ...data[14] });

      return data;
    },
  },
  {
    id: 'healthcare_patient',
    name: 'Healthcare Clinical & Hospital Outcomes',
    category: 'Healthcare & Clinical',
    description: 'Patient admissions, diagnoses, length of hospital stay, treatment cost, and insurance types.',
    rowsCount: 210,
    colsCount: 9,
    fileName: 'hospital_clinical_outcomes.csv',
    generator: () => {
      const diagnoses = ['Cardiovascular', 'Orthopedic', 'Respiratory', 'Neurological', 'Gastrointestinal', 'Endocrine'];
      const insurances = ['Medicare', 'Blue Cross', 'Aetna', 'UnitedHealth', 'Private Pay'];
      const genders = ['Female', 'Male'];
      const data: Record<string, any>[] = [];

      const startDate = new Date('2024-01-01').getTime();
      const endDate = new Date('2024-12-01').getTime();

      for (let i = 1; i <= 210; i++) {
        const age = Math.floor(18 + Math.random() * 70);
        const gender = genders[Math.floor(Math.random() * genders.length)];
        const diagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)];
        const insurance = insurances[Math.floor(Math.random() * insurances.length)];
        const lengthOfStay = Math.floor(1 + Math.random() * 14);
        const baseCost = diagnosis === 'Cardiovascular' ? 8500 : diagnosis === 'Orthopedic' ? 11200 : diagnosis === 'Neurological' ? 14000 : 4500;
        const treatmentCost = Number((baseCost + lengthOfStay * 950 + Math.random() * 2500).toFixed(2));
        const readmitted = lengthOfStay > 8 || age > 65 ? (Math.random() > 0.65 ? 'Yes' : 'No') : 'No';
        const admissionTime = startDate + Math.random() * (endDate - startDate);
        const admissionDate = new Date(admissionTime).toISOString().split('T')[0];

        data.push({
          patient_id: `PT-${9000 + i}`,
          admission_date: admissionDate,
          age: age,
          gender: gender,
          diagnosis: diagnosis,
          length_of_stay_days: lengthOfStay,
          treatment_cost: treatmentCost,
          insurance_provider: insurance,
          readmitted_30d: readmitted,
        });
      }

      data[20].treatment_cost = null;
      data.push({ ...data[11] });

      return data;
    },
  },
];
