// @ts-nocheck

post(
	"/:userId/posts?search&advanced&count",

	// params only parses

	/*
		userId always exists as string,
		but params() parses it to number
	*/
	params({
		userId: number,
		groupId: number,
		//^^^^^ TS ERROR
	}),

	// query validates and parses

	/*
		search always exists as ?: string
		query() ensures it must exist as string
		it also parses the existence of advanced to boolean
		and parses count to number
	*/
	query({
		search: string,
		advanced: boolean,
		count: number,
	}),

	// body only validates

	body({
		searchToken: string,
	}),

	handler,
);
