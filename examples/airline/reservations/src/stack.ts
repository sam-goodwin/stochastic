import * as cdk from "@aws-cdk/core"
import * as ddb from "@aws-cdk/aws-dynamodb"
import { EventBus } from "@aws-cdk/aws-events"

import { reservations } from "./service"
import { operations, FlightCancelled } from "operations"
import {
  BoundedContextConstruct,
  ReceiveEventBridgeEventBinding,
  DynamoDBConfigBinding
} from "stochastic-aws-serverless"

export class ReservationStack extends cdk.Stack {
  readonly operations: BoundedContextConstruct<typeof operations>
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const eventBus = EventBus.fromEventBusArn(
      this,
      "DefaultEventBus",
      this.formatArn({
        service: "events",
        resource: "event-bus",
        sep: "/",
        resourceName: "default"
      })
    )

    const table = new ddb.Table(this, "SeatsTable", {
      partitionKey: {
        name: "id",
        type: ddb.AttributeType.STRING
      }
    })

    const context = new BoundedContextConstruct(this, "BoundedContext", {
      boundedContext: reservations,
      receiveEvents: [
        new ReceiveEventBridgeEventBinding({
          otherBoundedContext: operations,
          events: [FlightCancelled],
          eventBus
        })
      ],
      config: {
        SeatsTable: new DynamoDBConfigBinding(table)
      }
    })
  }
}

const app = new cdk.App()
new ReservationStack(app, "Reservations")
