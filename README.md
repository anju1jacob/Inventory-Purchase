# Inventory Purchase Module

A full-stack inventory purchase management system built with Python, Django, Django REST Framework, PostgreSQL, Angular, TypeScript, and Bootstrap.

## Tech Stack

- Python 3
- Django
- Django REST Framework
- PostgreSQL
- Django ORM
- django-filter
- Angular
- TypeScript
- Bootstrap
- Angular Reactive Forms
- Angular HttpClient
- python-dotenv
- django-cors-headers

## Features

The application supports:

- Product creation and maintenance
- Unique product codes
- Product categorization
- Cost price and selling price management
- Selling price validation against cost price
- Product activation and deactivation
- Product-level tax assignment
- Simple percentage tax configuration
- Compound tax configuration
- Compound tax components
- Tax activation and deactivation
- Historical tax snapshots on posted purchases
- Supplier and invoice details in purchase vouchers
- Multiple products per purchase voucher
- Purchase line quantity and unit cost
- Line-level discounts
- Automatic purchase line calculations
- Automatic voucher total calculations
- Purchase voucher draft creation
- Purchase voucher posting
- Validation before voucher posting
- Posted voucher immutability
- Lot-controlled products
- Lot number validation
- Expiry date validation
- Expired lot prevention during purchase posting
- Product and lot-level inventory
- Prevention of duplicate product/lot inventory
- Expired inventory exclusion from usable quantity
- Transaction-safe purchase posting
- Inventory updates only after successful voucher posting
- Inventory received timestamp for stock ordering
- REST API pagination
- API filtering, searching, and ordering where configured
- Angular frontend for products, taxes, purchases, and inventory

## Database

PostgreSQL is used as the application's database.

Create a PostgreSQL database and configure the database connection through environment variables.

Example:

```env
SECRET_KEY=your-secret-key
DEBUG=True

DB_NAME=inventory_purchase
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
```
## Setup

### 1. Clone the repository

git clone <repository-url>
cd inventory-purchase

### 2. Create a virtual environment

Windows:

```cmd
cd backend
python -m venv venv
venv\Scripts\activate
```

### 3. Install dependencies

```cmd
pip install -r requirements.txt
```
### 4. Configure environment variables

Create a `.env` file using `.env.example` as a template.

Configure the PostgreSQL database credentials.

### 5. Run migrations

```cmd
python manage.py migrate
```
### 6. Create an administrator

```cmd
python manage.py createsuperuser
```

### 7. Run the development server

```cmd
python manage.py runserver
```
The API will be available at:

```text
http://127.0.0.1:8000/
```

The Django administration interface is available at:

```text
http://127.0.0.1:8000/admin/
```

## Frontend Setup

Open a new terminal from the project root.

### 1. Navigate to the frontend
cd frontend
### 2. Install Angular dependencies
npm install
### 3. Start the Angular development server
ng serve

The frontend will be available at:

http://localhost:4200/

### Purchase Calculation

For each purchase line:

Gross Amount = Quantity × Unit Cost

Taxable Amount = Gross Amount - Discount

Tax Amount = Taxable Amount × Tax Rate / 100

Line Total = Taxable Amount + Tax Amount
