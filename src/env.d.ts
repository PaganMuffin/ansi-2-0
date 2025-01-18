/// <reference types="astro/client" />

declare namespace App {
	interface Locals {
		runtime: {
			env: {
				DB_ANSI_OLD: D1Database;
				R2_ANSI_OLD: R2Bucket;
			};
		};
	}
}
