import * as aws from "@pulumi/aws";
import {
  DeleteObjectRequest,
  DeleteObjectsRequest,
  ObjectIdentifier
} from "aws-sdk/clients/s3";

// Create an AWS resource (S3 Bucket)
const trashBucket = new aws.s3.Bucket("trash");

// A handler function that will list objects in the bucket and bulk delete them
const emptyTrash: aws.cloudwatch.EventRuleEventHandler = async (
  event: aws.cloudwatch.EventRuleEvent
) => {
  const s3Client = new aws.sdk.S3();
  const bucket = trashBucket.id.get();

  const { Contents = [] } = await s3Client
    .listObjects({ Bucket: bucket })
    .promise();
  const objects: ObjectIdentifier[] = Contents.map(object => {
    const { Key = "" } = object; // object.Key is string || undefined
    return { Key };
  });

  await s3Client
    .deleteObjects({
      Bucket: bucket,
      Delete: { Objects: objects, Quiet: false }
    })
    .promise();
};

// Schedule the function to run every Friday at 11:00pm UTC (6:00pm EST)
// More info on Schedule Expressions at https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html
const emptyTrashSchedule: aws.cloudwatch.EventRuleEventSubscription = aws.cloudwatch.onSchedule(
  "emptyTrash",
  "cron(0 23 ? * FRI *)",
  emptyTrash
);

// Export the name of the bucket
export const bucketName = trashBucket.id;
