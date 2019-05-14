alter table users
	add "referralCode" VARCHAR(6) default null unique;

alter table users
	add "referredBy" bigint;

alter table users
	add constraint users_users_id_fk
		foreign key ("referredBy") references users;


