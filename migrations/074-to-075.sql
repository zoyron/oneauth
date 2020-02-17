alter table clients
	add column "androidOTPHash" varchar;

alter table usermobileotps
    	add column "clientId" bigint;


alter table usermobileotps
    add constraint "usermobileotps_userId_fkey"
        foreign key ("clientId") references clients
            on update cascade on delete set null;



