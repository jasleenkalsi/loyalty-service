import express, { Request, Response, Express } from "express";

/**
 * Interface representing a customer.
 */
interface Customer {
	id: number;
	name: string;
	status: "GOLD" | "SILVER" | "BRONZE";
	points: number;
	lastPurchaseDate: string;
	email?: string;
	preferredStore?: string;
	joinDate: string;
	notifications: boolean;
	lastStatusChange?: string;
}

const customers: Customer[] = [
	{
		id: 1,
		name: "John Smith",
		status: "SILVER",
		points: 450,
		lastPurchaseDate: "2024-02-15",
		joinDate: "2023-06-15",
		notifications: true,
		preferredStore: "Downtown",
	},
	{
		id: 2,
		name: "Jane Doe",
		status: "GOLD",
		points: 850,
		lastPurchaseDate: "2024-03-01",
		email: "jane.doe@email.com",
		joinDate: "2023-01-20",
		notifications: false,
	},
];

const app: Express = express();
app.use(express.json());

/**
 * Retrieve a customer by ID.
 * @route GET /api/customers/:id
 * @param req - Express request object
 * @param res - Express response object
 */
app.get("/api/customers/:id", (req: Request, res: Response): void => {
	const customerId: number = parseInt(req.params.id);
	const customer: Customer | undefined = customers.find(
		(c) => c.id === customerId
	);
	if (customer) {
		res.json(customer);
	} else {
		res.status(404).send("Customer not found");
	}
});

/**
 * Record a purchase for a customer and update status based on points and bonus system.
 * @route POST /api/customers/:id/purchase
 * @param req - Express request object
 * @param res - Express response object
 */
app.post("/api/customers/:id/purchase", (req: Request, res: Response): void => {
	const customerId: number = parseInt(req.params.id);
	const customer: Customer | undefined = customers.find(
		(c) => c.id === customerId
	);
	if (!customer) {
		res.status(404).send("Customer not found");
		return;
	}

	const purchaseAmount: number = req.body.amount;
	const storeLocation: string = req.body.storeLocation;

	// Validate purchase amount
	if (!purchaseAmount || purchaseAmount <= 0) {
		res.status(400).send("Invalid purchase amount");
		return;
	}

	let basePoints = Math.floor(purchaseAmount / 10);

	// Apply bonus points for high-value purchases
	if (purchaseAmount > 5000) {
		basePoints += Math.floor(basePoints * 0.2); // 20% bonus
	} else if (purchaseAmount > 1000) {
		basePoints += Math.floor(basePoints * 0.1); // 10% bonus
	}

	customer.points += basePoints;
	customer.lastPurchaseDate = new Date().toISOString();

	// Update customer status
	if (customer.points >= 750) {
		customer.status = "GOLD";
		customer.lastStatusChange = new Date().toISOString();
	} else if (customer.points >= 500) {
		customer.status = "SILVER";
		customer.lastStatusChange = new Date().toISOString();
	}

	res.json({
		message: "Purchase recorded successfully",
		customer,
		storeLocation,
	});
});

/**
 * Update customer preferences, such as notifications, preferred store, and email.
 * @route PATCH /api/customers/:id/preferences
 * @param req - Express request object
 * @param res - Express response object
 */
app.patch(
	"/api/customers/:id/preferences",
	(req: Request, res: Response): void => {
		const customerId: number = parseInt(req.params.id);
		const customer: Customer | undefined = customers.find(
			(c) => c.id === customerId
		);
		if (!customer) {
			res.status(404).send("Customer not found");
			return;
		}

		if (typeof req.body.notifications === "boolean") {
			customer.notifications = req.body.notifications;
		}
		if (typeof req.body.preferredStore === "string") {
			customer.preferredStore = req.body.preferredStore;
		}
		if (typeof req.body.email === "string") {
			customer.email = req.body.email;
		}

		res.json(customer);
	}
);

/**
 * Update customer email if it is missing (legacy customer).
 * @route PATCH /api/customers/:id/update-email
 * @param req - Express request object
 * @param res - Express response object
 */
app.patch("/api/customers/:id/update-email", (req: Request, res: Response): void => {
	const customerId: number = parseInt(req.params.id);
	const customer: Customer | undefined = customers.find(
		(c) => c.id === customerId
	);
	if (!customer) {
		res.status(404).send("Customer not found");
		return;
	}

	// Check if email is missing (legacy customer)
	if (!customer.email) {
		const newEmail: string = req.body.email;

		// Validate new email format
		const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
		if (!newEmail || !emailRegex.test(newEmail)) {
			res.status(400).send("Invalid email address");
			return;
		}

		// update the email 
		customer.email = newEmail;

		res.json({
			message: "Customer email updated successfully",
			customer,
		});
	} else {
		res.status(400).send("Customer already has an email address");
	}
});

export default app;
