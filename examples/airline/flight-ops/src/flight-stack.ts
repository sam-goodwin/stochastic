import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as dynamodb from "@aws-cdk/aws-dynamodb";

import { flightEventStorm } from "./flight-event-storm";
import { EventStormConstruct } from "stochastic/lib/cjs/infrastructure";

export class FlightOpsStack extends cdk.Stack {
  readonly eventStorm: EventStormConstruct<typeof flightEventStorm>;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.eventStorm = new EventStormConstruct(this, "FlightEventStorm", {
      storm: flightEventStorm,
      components: {
        // provide options properties for each of the components
        delayFlight: {
          runtime: lambda.Runtime.NODEJS_12_X, // e.g. use an older version of Node JS,
          timeout: cdk.Duration.minutes(1), // configure the runtime for thie Delay Flight Command's handler
          environment: {
            STRIPE_API: "stripe",
          },
        },
        flights: {
          // .. or maybe something like overriding the underlying CDK Constructs.
          table: new dynamodb.Table(this, "OverrideTable", {
            partitionKey: {
              name: "id",
              type: dynamodb.AttributeType.STRING,
            },
          }),
        },
      },
    });
  }
}

const app = new cdk.App();
new FlightOpsStack(app, "FlightOps");
